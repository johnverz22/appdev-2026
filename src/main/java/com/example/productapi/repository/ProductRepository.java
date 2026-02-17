package com.example.productapi.repository;

import com.example.productapi.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for Product entity.
 * Provides CRUD operations and custom query methods.
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    // JpaRepository provides all basic CRUD operations:
    // - findAll()
    // - findById(Long id)
    // - save(Product product)
    // - deleteById(Long id)
    // - delete(Product product)

    // Additional custom query methods can be added here if needed
}
