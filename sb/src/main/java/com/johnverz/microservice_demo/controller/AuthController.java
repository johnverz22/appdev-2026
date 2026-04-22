package com.johnverz.microservice_demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.johnverz.microservice_demo.dto.LoginRequest;
import com.johnverz.microservice_demo.dto.SignupRequest;
import com.johnverz.microservice_demo.model.User;
import com.johnverz.microservice_demo.repository.UserRepository;
import com.johnverz.microservice_demo.security.JwtUtils;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import java.util.Collections;
import java.util.UUID;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder encoder;
    @Autowired private JwtUtils jwtUtils;

    @Value("${jwt.expiration}")      private int    jwtExpirationMs;
    @Value("${jwt.cookie.domain}")   private String jwtDomain;
    @Value("${admin.username}")      private String adminUsername;
    @Value("${admin.password}")      private String adminPassword;
    @Value("${google.client.id:placeholder}") private String googleClientId;

    // ── Seed admin account on startup ─────────────────────────────────────────
    @EventListener(ApplicationReadyEvent.class)
    public void seedAdmin() {
        if (userRepository.findByUsername(adminUsername).isEmpty()) {
            userRepository.save(new User(
                adminUsername,
                encoder.encode(adminPassword),
                adminUsername + "@admin.com",
                "ROLE_ADMIN"
            ));
            System.out.println("[Auth] Admin account created: " + adminUsername);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private Cookie buildJwtCookie(String token) {
        Cookie cookie = new Cookie("jwt", token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setDomain(jwtDomain);
        cookie.setMaxAge(jwtExpirationMs / 1000);
        return cookie;
    }

    private Cookie expiredJwtCookie() {
        Cookie cookie = new Cookie("jwt", "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setDomain(jwtDomain);
        cookie.setMaxAge(0);
        return cookie;
    }

    // ── POST /api/auth/login ──────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest,
                                   HttpServletResponse response) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getUsername(), loginRequest.getPassword()));

            String username = authentication.getName();
            String role = userRepository.findByUsername(username)
                .map(User::getRole).orElse("ROLE_USER");

            String jwt = jwtUtils.generateToken(username, role);
            response.addCookie(buildJwtCookie(jwt));
            return ResponseEntity.ok(Map.of("username", username, "role", role));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid username or password"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Authentication failed"));
        }
    }

    // ── POST /api/auth/register ───────────────────────────────────────────────
    // Public registration always creates ROLE_USER accounts.
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody SignupRequest signUpRequest,
                                      HttpServletResponse response) {
        if (userRepository.findByUsername(signUpRequest.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "Username is already taken"));
        }

        String role = "ROLE_USER";
        userRepository.save(new User(
            signUpRequest.getUsername(),
            encoder.encode(signUpRequest.getPassword()),
            null,
            role
        ));

        String jwt = jwtUtils.generateToken(signUpRequest.getUsername(), role);
        response.addCookie(buildJwtCookie(jwt));
        return ResponseEntity.ok(Map.of("username", signUpRequest.getUsername(), "role", role));
    }

    // ── POST /api/auth/google ──────────────────────────────────────────────────
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request, HttpServletResponse response) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
                
            GoogleIdToken idToken = verifier.verify(request.get("token"));
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();
                String email = payload.getEmail();
                
                User user = userRepository.findByEmail(email).orElse(null);
                
                if (user == null) {
                    user = new User();
                    user.setUsername(email.split("@")[0]);
                    user.setEmail(email);
                    user.setPassword(encoder.encode(UUID.randomUUID().toString()));
                    user.setRole("ROLE_USER");
                    userRepository.save(user);
                }
                
                String jwt = jwtUtils.generateToken(user.getUsername(), user.getRole());
                response.addCookie(buildJwtCookie(jwt));
                   
                return ResponseEntity.ok(Map.of("username", user.getUsername(), "role", user.getRole()));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid ID token."));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ── POST /api/auth/logout ─────────────────────────────────────────────────
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        response.addCookie(expiredJwtCookie());
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    // ── GET /api/auth/me ──────────────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<?> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String username = auth.getName();
        String role = userRepository.findByUsername(username)
            .map(User::getRole).orElse("ROLE_USER");
        return ResponseEntity.ok(Map.of("username", username, "role", role));
    }
}
