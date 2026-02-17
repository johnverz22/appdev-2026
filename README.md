# Product API - Contract-First Development Tutorial

A comprehensive tutorial demonstrating **contract-first API development** using OpenAPI, Spring Boot, Flyway migrations, and PostgreSQL.

## 📚 Table of Contents

- [Introduction](#introduction)
- [What is Contract-First Development?](#what-is-contract-first-development)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Step-by-Step Guide](#step-by-step-guide)
  - [Step 1: Understanding the OpenAPI Specification](#step-1-understanding-the-openapi-specification)
  - [Step 2: Database Migration with Flyway](#step-2-database-migration-with-flyway)
  - [Step 3: Code Generation from OpenAPI](#step-3-code-generation-from-openapi)
  - [Step 4: Implementing the API](#step-4-implementing-the-api)
  - [Step 5: Running Locally](#step-5-running-locally)
  - [Step 6: Docker Deployment](#step-6-docker-deployment)
- [Testing the API](#testing-the-api)
- [Key Concepts Explained](#key-concepts-explained)
- [Troubleshooting](#troubleshooting)

---

## Introduction

This project demonstrates a **contract-first approach** to building RESTful APIs. Instead of writing code first and documenting later, we:

1. **Define the API contract** using OpenAPI 3.0 specification
2. **Generate code** from the contract
3. **Implement** the business logic
4. **Ensure** the implementation matches the contract

This approach provides:
- **Clear API documentation** before writing any code
- **Type-safe interfaces** generated from the specification
- **Consistency** between documentation and implementation
- **Better collaboration** between frontend and backend teams

---

## What is Contract-First Development?

**Contract-First Development** means defining your API contract (the "what") before implementing it (the "how").

### Traditional Approach (Code-First)
```
Write Code → Generate Documentation → Hope they match
```

### Contract-First Approach
```
Write OpenAPI Spec → Generate Code Interfaces → Implement Business Logic
```

**Benefits:**
- API design is reviewed before implementation
- Frontend and backend teams can work in parallel
- Generated code ensures contract compliance
- Documentation is always up-to-date

---

## Prerequisites

Before starting, ensure you have:

- **Java 17** or higher ([Download](https://adoptium.net/))
- **Maven 3.8+** ([Download](https://maven.apache.org/download.cgi))
- **PostgreSQL 15** ([Download](https://www.postgresql.org/download/)) OR **Docker** ([Download](https://www.docker.com/get-started))
- **curl** or **Postman** for API testing
- Your favorite IDE (IntelliJ IDEA, VS Code, Eclipse)

---

## Dependencies

This project uses the following key dependencies:

### Core Spring Boot Dependencies

- **spring-boot-starter-web** - REST API support with embedded Tomcat server
- **spring-boot-starter-data-jpa** - JPA/Hibernate for database operations
- **spring-boot-starter-validation** - Bean validation support for request validation
- **spring-boot-starter-test** - Testing framework (JUnit, Mockito, etc.)

### Database Dependencies

- **postgresql** - PostgreSQL JDBC driver for database connectivity
- **flyway-core** - Database migration management
- **flyway-database-postgresql** - PostgreSQL-specific Flyway support

### OpenAPI/Code Generation

- **swagger-annotations** (v2.2.20) - OpenAPI annotations for generated code
- **jackson-databind-nullable** (v0.2.6) - Support for nullable types in generated models

### Utility Libraries

- **lombok** - Reduces boilerplate code with annotations (@Data, @Getter, etc.)

### Maven Plugins

- **spring-boot-maven-plugin** - Packages the application as an executable JAR
- **openapi-generator-maven-plugin** (v7.2.0) - Generates Java code from OpenAPI specification
- **build-helper-maven-plugin** - Adds generated sources to the build classpath

> [!IMPORTANT]
> The **build-helper-maven-plugin** is crucial for making generated OpenAPI code accessible in your controllers. Without it, your IDE may not recognize the generated interfaces and models.

---

## Project Structure

```
product-api/
├── src/
│   ├── main/
│   │   ├── java/com/example/productapi/
│   │   │   ├── controller/
│   │   │   │   └── ProductController.java      # REST controller
│   │   │   ├── service/
│   │   │   │   └── ProductService.java         # Business logic
│   │   │   ├── repository/
│   │   │   │   └── ProductRepository.java      # Data access
│   │   │   ├── entity/
│   │   │   │   └── Product.java                # JPA entity
│   │   │   └── ProductApiApplication.java      # Main class
│   │   └── resources/
│   │       ├── openapi/
│   │       │   └── api.yaml                    # OpenAPI specification
│   │       ├── db/migration/
│   │       │   └── V1__create_product_table.sql # Flyway migration
│   │       └── application.properties          # Configuration
│   └── test/
├── pom.xml                                     # Maven configuration
└── README.md                                   # This file
```

---

## Step-by-Step Guide

### Step 1: Understanding the OpenAPI Specification

The heart of contract-first development is the **OpenAPI specification** (`src/main/resources/openapi/api.yaml`).

#### Key Sections:

**1. API Metadata**
```yaml
info:
  title: Product API
  version: 1.0.0
  description: A RESTful API for managing products
```

**2. Schemas (Data Models)**
```yaml
components:
  schemas:
    Product:
      type: object
      required:
        - id
        - name
        - price
        - quantity
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
          minLength: 1
          maxLength: 100
        # ... more fields
```

**3. API Endpoints**
```yaml
paths:
  /products:
    get:
      summary: Get all products
      operationId: getAllProducts
      responses:
        '200':
          description: Successful operation
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Product'
```

**Key Points:**
- `operationId` becomes the method name in generated code
- `$ref` references reusable schema definitions
- Validation rules (minLength, minimum, etc.) are defined here

---

### Step 2: Database Migration with Flyway

**Flyway** manages database schema changes through versioned SQL migration scripts.

#### Migration File: `V1__create_product_table.sql`

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert 5 sample products
INSERT INTO products (name, description, price, quantity) VALUES
    ('Laptop', 'High-performance laptop...', 999.99, 50),
    -- ... more products
```

**Naming Convention:**
- `V1__` = Version 1
- `create_product_table` = Description
- Flyway runs migrations in order and tracks which have been applied

**Configuration** (`application.properties`):
```properties
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.locations=classpath:db/migration
```

---

### Step 3: Code Generation from OpenAPI

The **OpenAPI Generator Maven Plugin** generates Java interfaces from the specification.

#### Maven Plugin Configuration (`pom.xml`):

```xml
<plugin>
    <groupId>org.openapitools</groupId>
    <artifactId>openapi-generator-maven-plugin</artifactId>
    <version>7.2.0</version>
    <executions>
        <execution>
            <goals>
                <goal>generate</goal>
            </goals>
            <configuration>
                <inputSpec>${project.basedir}/src/main/resources/openapi/api.yaml</inputSpec>
                <generatorName>spring</generatorName>
                <apiPackage>com.example.productapi.api</apiPackage>
                <modelPackage>com.example.productapi.model</modelPackage>
                <supportingFilesToGenerate>ApiUtil.java</supportingFilesToGenerate>
                <configOptions>
                    <interfaceOnly>true</interfaceOnly>
                    <useSpringBoot3>true</useSpringBoot3>
                    <useTags>true</useTags>
                    <skipDefaultInterface>true</skipDefaultInterface>
                </configOptions>
            </configuration>
        </execution>
    </executions>
</plugin>

<!-- Build Helper Plugin to add generated sources to classpath -->
<plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>build-helper-maven-plugin</artifactId>
    <executions>
        <execution>
            <id>add-source</id>
            <phase>generate-sources</phase>
            <goals>
                <goal>add-source</goal>
            </goals>
            <configuration>
                <sources>
                    <source>${project.build.directory}/generated-sources/openapi/src/main/java</source>
                </sources>
            </configuration>
        </execution>
    </executions>
</plugin>
```

**Generated Code:**
- `ProductsApi.java` - Interface with method signatures
- `Product.java`, `ProductRequest.java` - Model classes
- Located in `target/generated-sources/openapi/`

**To generate code:**
```bash
.\mvnw.cmd clean generate-sources
```

---

### Step 4: Implementing the API

#### 4.1 JPA Entity (`Product.java`)

Maps to the database table:

```java
@Entity
@Table(name = "products")
@Data
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    // ... more fields
}
```

#### 4.2 Repository (`ProductRepository.java`)

Spring Data JPA repository:

```java
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    // Inherits: findAll(), findById(), save(), deleteById()
}
```

#### 4.3 Service Layer (`ProductService.java`)

Business logic and data transformation:

```java
@Service
public class ProductService {
    private final ProductRepository productRepository;
    
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }
    
    public Product createProduct(ProductRequest request) {
        Product product = new Product();
        product.setName(request.getName());
        // ... set other fields
        return productRepository.save(product);
    }
}
```

#### 4.4 Controller (`ProductController.java`)

Implements the **generated interface**:

```java
@RestController
public class ProductController implements ProductsApi {
    private final ProductService productService;
    
    @Override
    public ResponseEntity<List<com.example.productapi.model.Product>> getAllProducts() {
        List<Product> products = productService.getAllProducts();
        // Convert entities to API models
        return ResponseEntity.ok(convertedProducts);
    }
}
```

**Key Point:** The controller implements `ProductsApi`, ensuring it matches the contract!

---

### Step 5: Running Locally

#### Option A: Using Local PostgreSQL

**1. Create the database:**
```bash
psql -U postgres
CREATE DATABASE product_db;
\q
```

**2. Update `application.properties` if needed:**
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/product_db
spring.datasource.username=postgres
spring.datasource.password=1234
```

**3. Build and run:**
```bash
# Generate OpenAPI code and build
.\mvnw.cmd clean package

# Run the application
.\mvnw.cmd spring-boot:run
```

#### Option B: Using Docker for PostgreSQL

**1. Start PostgreSQL container:**
```bash
docker run --name postgres-db \
  -e POSTGRES_DB=product_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=1234 \
  -p 5432:5432 \
  -d postgres:15
```

**2. Build and run the application:**
```bash
.\mvnw.cmd clean package
.\mvnw.cmd spring-boot:run
```

**Application will start on:** `http://localhost:8080`

---

### Step 6: Docker Deployment

Deploy both PostgreSQL and the Spring Boot application using Docker.

#### 6.1 Start PostgreSQL Container

```bash
docker run --name postgres-db \
  -e POSTGRES_DB=product_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=1234 \
  -p 5432:5432 \
  -d postgres:15
```

**Explanation:**
- `--name postgres-db` - Container name
- `-e POSTGRES_DB=productdb` - Creates database
- `-e POSTGRES_USER=postgres` - Database user
- `-e POSTGRES_PASSWORD=password` - Database password
- `-p 5432:5432` - Port mapping (host:container)
- `-d` - Run in detached mode
- `postgres:15` - PostgreSQL 15 image

#### 6.2 Build the Application JAR

```bash
cd app #or your root directory
.\mvnw.cmd clean package -DskipTests
```

This creates: `target/product-api-1.0.0.jar`

#### 6.3 Run the Application Container

```bash
docker run --name product-api \
  -v $(pwd)/target/product-api-1.0.0.jar:/app/app.jar \
  -p 8080:8080 \
  --link postgres-db:postgres \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/product_db \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=1234 \
  -d openjdk:26-ea-17-slim \
  java -jar /app/app.jar
```

**Explanation:**
- `-v $(pwd)/target/...` - Mount JAR file into container
- `-p 8080:8080` - Expose port 8080
- `--link postgres-db:postgres` - Link to PostgreSQL container
- `-e SPRING_DATASOURCE_URL=...` - Override database URL
- `openjdk:17-jdk-slim` - Java 17 runtime image
- `java -jar /app/app.jar` - Command to run

#### 6.4 Verify Containers are Running

```bash
docker ps
```

You should see both `postgres-db` and `product-api` containers.

#### 6.5 View Application Logs

```bash
docker logs -f product-api
```

Look for: `Started ProductApiApplication in X seconds`

---

## Testing the API

### Using curl

**1. Get all products:**
```bash
curl http://localhost:8080/api/v1/products
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "name": "Laptop",
    "description": "High-performance laptop with 16GB RAM and 512GB SSD",
    "price": 999.99,
    "quantity": 50
  },
  ...
]
```

**2. Get product by ID:**
```bash
curl http://localhost:8080/api/v1/products/1
```

**3. Create a new product:**
```bash
curl -X POST http://localhost:8080/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Headphones",
    "description": "Noise-cancelling wireless headphones",
    "price": 199.99,
    "quantity": 100
  }'
```

**4. Update a product:**
```bash
curl -X PUT http://localhost:8080/api/v1/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gaming Laptop",
    "description": "High-performance gaming laptop with RTX 4080",
    "price": 1499.99,
    "quantity": 25
  }'
```

**5. Delete a product:**
```bash
curl -X DELETE http://localhost:8080/api/v1/products/1
```

### Using Postman

1. Import the OpenAPI specification: `src/main/resources/openapi/api.yaml`
2. Postman will automatically create all requests
3. Set base URL to: `http://localhost:8080/api/v1`

---

## Key Concepts Explained

### 1. Contract-First vs Code-First

| Aspect | Contract-First | Code-First |
|--------|---------------|------------|
| **Starting Point** | OpenAPI Spec | Java Code |
| **Documentation** | Always up-to-date | Often outdated |
| **Team Collaboration** | Frontend/Backend parallel | Sequential |
| **API Design Review** | Before implementation | After implementation |
| **Type Safety** | Generated interfaces | Manual implementation |

### 2. OpenAPI Generator Benefits

- **Consistency:** Implementation must match the contract
- **Type Safety:** Compile-time errors if contract changes
- **Productivity:** No need to write boilerplate API code
- **Validation:** Request/response validation from spec

### 3. Flyway Migration Strategy

**Versioned Migrations:**
- `V1__initial_schema.sql` - First version
- `V2__add_category_column.sql` - Second version
- Never modify existing migrations
- Always create new migrations for changes

**Why Flyway?**
- Database schema as code
- Version control for database changes
- Automatic migration on application startup
- Rollback capabilities

### 4. Layered Architecture

```
Controller (REST API)
    ↓
Service (Business Logic)
    ↓
Repository (Data Access)
    ↓
Database (PostgreSQL)
```

**Separation of Concerns:**
- **Controller:** HTTP handling, request/response mapping
- **Service:** Business logic, validation, transactions
- **Repository:** Database operations
- **Entity:** Database table representation

### 5. Docker Networking

When using `--link`:
- Containers can communicate using container names
- `postgres-db` becomes a hostname in the application container
- URL: `jdbc:postgresql://postgres:5432/productdb`

**Modern Alternative:** Docker networks (for production)

---

## Troubleshooting

### Issue: "Failed to configure a DataSource"

**Cause:** PostgreSQL not running or connection details incorrect

**Solution:**
1. Verify PostgreSQL is running: `docker ps` or `psql -U postgres`
2. Check `application.properties` connection details
3. Ensure database `productdb` exists

### Issue: "Table 'products' doesn't exist"

**Cause:** Flyway migration didn't run

**Solution:**
1. Check logs for Flyway errors
2. Verify migration file is in `src/main/resources/db/migration/`
3. Ensure filename follows pattern: `V1__description.sql`
4. Check `spring.flyway.enabled=true` in properties

### Issue: "Port 8080 already in use"

**Solution:**
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or change port in application.properties
server.port=8081
```

### Issue: Generated code not found

**Cause:** OpenAPI Generator hasn't run

**Solution:**
```bash
.\mvnw.cmd clean generate-sources
```

Check `target/generated-sources/openapi/` for generated files

### Issue: Docker container won't start

**Check logs:**
```bash
docker logs product-api
```

**Common causes:**
- JAR file path incorrect
- PostgreSQL container not running
- Environment variables incorrect

**Restart containers:**
```bash
docker stop product-api postgres-db
docker rm product-api postgres-db
# Then run the docker run commands again
```

### Issue: "Connection refused" to PostgreSQL

**When using Docker:**
- Use `--link` or Docker networks
- URL should use container name: `postgres:5432`
- Not `localhost:5432` from inside container

**When running locally:**
- URL should use `localhost:5432`
- Ensure PostgreSQL is accepting connections

---

## Next Steps

Now that you have a working contract-first API, consider:

1. **Add more endpoints** - Implement search, filtering, pagination
2. **Add validation** - Use Bean Validation annotations
3. **Add security** - Implement Spring Security with JWT
4. **Add tests** - Write unit and integration tests
5. **Add API documentation UI** - Integrate Swagger UI
6. **Improve Docker setup** - Use Docker Compose for easier orchestration
7. **Add CI/CD** - Automate builds and deployments

---

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Flyway Documentation](https://flywaydb.org/documentation/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## License

This is a tutorial project for educational purposes.

---

**Happy Coding! 🚀**
