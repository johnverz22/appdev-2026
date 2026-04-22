# Architectural Comparison: In-House Social Login vs. Managed IdP

This document highlights the core differences, pros, and cons between integrating **Google Auth into your existing Spring Boot service** versus migrating your architecture to a **Managed Identity Provider (IdP)** like Auth0 or Keycloak.

---

## 1. Google Auth + Existing Spring Boot (In-House Approach)

In this approach, you keep your custom Spring Boot (`sb/`) authentication service and your local PostgreSQL `users` table. When a user logs in via Google, you translate their Google token into your *own* custom JWT.

### How it Works visually:
`React Frontend` → *(Google Token)* → `Spring Boot (sb/)` → *(Issues Custom JWT)* → `API Gateway`

### Pros:
*   **Complete Data Ownership:** You retain full control over your `users` table because it lives locally inside your own PostgreSQL database alongside your other business logic.
*   **Minimal Impact on Downstream Services:** Because the Spring Boot service still translates the incoming Google token into the exact same `HttpOnly` JWT cookie your system already uses, your PHP, Django, and Gateway configurations require **zero** changes.
*   **No Vendor Lock-in:** You can easily swap architectures or database structures without worrying about how a 3rd-party SaaS structures user data.

### Cons:
*   **High Maintenance:** You are solely responsible for hashing passwords, issuing JWTs, handling password resets, email verification, and managing security vulnerabilities inside `sb/`.
*   **Hard to Scale Providers:** If you want to add Facebook, Apple, or GitHub login later, you have to write custom backend logic and verification code for each new provider in Spring Boot.

---

## 2. Managed IdP (Auth0 / Keycloak / Supabase)

In this approach, you outsource everything related to identity. You **delete the Spring Boot auth service** entirely. The API Gateway becomes a pure OAuth2 Resource Server that mathematically trusts tokens issued by your provider.

### How it Works visually:
`React Frontend` → *(Redirects to Auth0)* → `Auth0` → *(Standard Access Token)* → `API Gateway` → *(Validates Keys & Routes to PHP/Django)*

### Pros:
*   **Zero Authentication Code:** Your backend code is purely business logic. You delete the `sb/` folder completely, drastically reducing your codebase size and maintenance burden.
*   **Instant Feature Enablement:** Adding Facebook login, Multi-Factor Authentication (MFA), biometric login, or Social SSO takes exactly one click in the Auth0/Keycloak dashboard—no backend code changes required.
*   **Enterprise-grade Security:** Relying on standard OAuth2 + OpenID Connect flows built by dedicated security teams, rather than maintaining a custom JWT cookie implementation.
*   **Hosted UI:** You get out-of-the-box, professionally designed Login, Signup, and Password Reset pages hosted by the IdP.

### Cons:
*   **Complexity Shift:** While backend code is reduced, you now have to learn how to appropriately configure your API Gateway to fetch JWKS keys and map custom claims.
*   **Data Fragmentation:** The user's credential data (Passwords, Emails) now lives in the IdP's database (Auth0/Keycloak), while their business constraints might live in your PostgreSQL database. Creating user profiles requires syncing IdP data to your internal tables using webhooks or standard identifier linking (e.g., using the `sub` claim).
*   **Vendor Pricing limits:** If using a SaaS like Auth0, crossing the free-tier limits can become expensive. (Self-hosting Keycloak bypasses this but adds infrastructure maintenance).

---

## Conclusion & Recommendation

*   If your goal is to **quickly add "Sign in with Google"** and avoid refactoring your API Gateway, proceed with the **[GOOGLE_AUTH_GUIDE.md](GOOGLE_AUTH_GUIDE.md)** approach.
*   If your goal is to **modernize your architecture for the long term**, remove security maintenance from your sprint backlog, and easily drop in multiple login methods, proceed with the **[MANAGED_IDP_GUIDE.md](MANAGED_IDP_GUIDE.md)** approach.
