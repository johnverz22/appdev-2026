package com.example.productapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main Spring Boot Application class for the Product API.
 * This application demonstrates contract-first API development using:
 * - OpenAPI 3.0 specification
 * - Flyway database migrations
 * - PostgreSQL database
 * - Spring Boot 4.0.2
 */
@SpringBootApplication
public class ProductApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProductApiApplication.class, args);
    }
}
