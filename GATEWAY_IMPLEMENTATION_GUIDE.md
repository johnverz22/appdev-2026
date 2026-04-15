# Beginner's Guide: Polyglot API Gateway & Centralized Auth

Welcome! This guide will help you transform a "messy" microservices project into a professional, secure architecture. If you've ever felt like every service (PHP, Java, Python) was doing the exact same authentication work over and over, this guide is for you.

---

## 1. What is an API Gateway? (The Analogy)

Imagine a large office building:
*   **Without a Gateway:** Every single office door (PHP, Django, Spring Boot) has its own expensive lock and a security guard. A visitor has to show their ID at every single door they enter. This is repetitive and hard to manage.
*   **With a Gateway:** There is one **Main Entrance** with a highly trained security team. You show your ID **once** at the front desk. They give you a badge and tell you exactly which room to go to. Once you're inside, the individual office doors trust that if you're in the building, you've already been checked.

**The API Gateway is that Main Entrance.**

---

## 2. The Three Musketeers of this Project

### A. Eureka Server (The Phonebook)
In a microservices world, services move around. They might change IP addresses or run on different ports. **Eureka** is like a dynamic phonebook. When a service (like Spring Boot) starts up, it "calls" Eureka and says: *"Hey, I'm the Auth service, and you can find me at this address!"* The Gateway then looks at this phonebook to know where to send your requests.

### B. Spring Cloud Gateway (The Security Guard)
This is the "Edge" of your system. It does two things:
1.  **Routing:** It looks at the URL (e.g., `/api/products`) and decides which backend (PHP) should handle it.
2.  **Edge Auth:** It checks if you have a valid `jwt` cookie. If you don't, it kicks you out (`401 Unauthorized`) before you even touch the database.

### C. Header Injection (The Introduction)
Once the Gateway validates your JWT, it extracts your username (e.g., `john_doe`) and "injects" it into a new header called `X-User-Name`. It then forwards the request to the backend. The backend (PHP or Django) simply reads this header and says: *"The Gateway says this is John Doe, and I trust the Gateway!"*

---

## 3. Implementation Steps
### Step 1: Setup Eureka Server (The Phonebook)
Create a Spring Boot module in `./eureka-server`.
*   **What it does:** It creates a registry where all your services will "check in" so they can find each other.

> **💡 Why is the code so small? (The Magic)**
> You might notice that your Eureka Server only has about 10 lines of code. This is the "magic" of Spring Boot. When you add the `@EnableEurekaServer` annotation, it acts as a **Master Switch**. 
>
> It automatically activates hundreds of pre-written features hidden inside the library you imported, including:
> 1.  **The Dashboard:** That nice UI you see at port 8761.
> 2.  **The Registration API:** The "reception desk" that other services call to check in.
> 3.  **Heartbeat Monitoring:** A background system that constantly checks if your services are still "alive."
>
> You don't have to write the code because the library does all the heavy lifting for you!

---

### Step 2: Setup API Gateway (The Front Door)
Create a Spring Boot module in `./api-gateway`.
*   **What it does:** This service will be the **only** one exposed to the internet. It will use a `GlobalFilter` (the `JwtAuthFilter.java`) to check every incoming request for a valid login token.

### Step 3: Configure Routing (`application.yml`)
This file is the "brain" of your Gateway. It contains the rules for where traffic should go.

**Key Parts Explained:**
1.  **`server.port: 8000`**: This is the only port you will open to the internet. All frontend calls must now point here.
2.  **`discovery.locator.enabled: true`**: This tells the Gateway to talk to **Eureka** to find where other services are running.
3.  **`routes`**:
    *   **`id`**: A unique name for the route.
    *   **`uri`**: Where the request is going. `lb://sb` tells it to use the Load Balancer to find the service named "sb" in Eureka. `http://php:80` uses the Docker container name.
    *   **`predicates`**: The "If" condition. *"If the URL starts with /api/auth, then use this route."*
    *   **`filters`**: Modifications to the request. **`RewritePath`** is crucial—it "trims" the URL. For example, it turns `/api/products/5` into just `/5` so the PHP backend (which doesn't know about the `/api/products` prefix) can understand it.

```yaml
# (See the full application.yml in the api-gateway folder for detailed comments)
```

### Step 4: Update Backends to "Trust" the Gateway
We changed the PHP, Django, and Spring Boot code to stop looking at the complex JWT token and start looking at the simple `X-User-Name` header.
*   **Why?** It makes your backends much faster and the code much cleaner. They only have one job now: Business Logic.

---

## 4. The Cleanup: Making Backends Lighter

One of the biggest benefits of a Gateway is that your backends (PHP, Java, Python) become much simpler. Once the Gateway is the "bouncer," you can remove redundant code:

### 1. Remove CORS from Backends
The browser only talks to the Gateway (port 8000). This means only the Gateway needs to handle CORS. You can delete the complex CORS configuration from your Spring Boot, PHP, and Django apps.

### 2. Simplify Authentication Filters
Your backends no longer need to "math check" the JWT signature or check for expiration. They can simply read the `X-User-Name` header. 
*   **Java example**: We simplified `JwtAuthenticationFilter` to just read the header and set the user in the Security Context.
*   **PHP/Django example**: We removed the `JWT_SECRET` decoding logic and replaced it with a simple header check.

### 3. Streamline JWT Utilities
The `JwtUtils` class in Spring Boot now only has **one job**: `generateToken`. It no longer needs to validate or parse tokens, because the Gateway handles that at the "Edge."

---

## 5. Docker & Security: The "Lockdown"
We updated `docker-compose.yml` to remove the `ports` section from the backend services.
*   **Before:** You could visit `localhost:8081` to bypass security and see products.
*   **After:** `localhost:8081` is now **closed**. The only way in is through the Gateway on `localhost:8000`. This is called "Network Isolation."

---

## 5. How to Run and Test

### 1. Start the System
```bash
docker compose up --build
```
*(If you get a timeout error, it's usually a slow internet connection. Try running `docker pull postgres:15-alpine` first.)*

### 2. Check the "Phonebook"
Visit **[http://localhost:8761](http://localhost:8761)**. You should see `API-GATEWAY` and `SB` registered. This means they are talking to each other!

### 3. Test the Security
Try to "cheat" and go to the PHP service directly: [http://localhost:8081/products](http://localhost:8081/products).
*   **Result:** It won't load! This means your security lockdown is working.

### 4. Use the App
Go to **[http://localhost:3000](http://localhost:3000)**. When you log in, watch your browser's "Network" tab. You'll see that **every** request now goes to port `8000` (The Gateway).

---

## Summary of Benefits
1.  **Security**: Your database and backends are hidden behind a single wall.
2.  **Consistency**: You don't have to write "Login Logic" in 5 different languages.
3.  **Scalability**: If you want to add a new service in Go or Ruby, you just add one line to the Gateway!
