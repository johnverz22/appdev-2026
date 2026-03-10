# ── Stage 1: Build the JAR ──────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app
COPY pom.xml .
# Download dependencies first so Docker can cache this layer
RUN mvn dependency:go-offline -q

COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage 2: Run the JAR ────────────────────────────────────────
FROM eclipse-temurin:17-jre

WORKDIR /app
COPY --from=build /app/target/orders-service-0.0.1.jar app.jar

EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
