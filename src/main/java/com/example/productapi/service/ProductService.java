package com.example.productapi.service;

import com.example.productapi.entity.Product;
import com.example.productapi.model.ProductRequest;
import com.example.productapi.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Service layer for Product business logic.
 * Handles data transformation between API models and entities.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;

    /**
     * Retrieve all products from the database.
     */
    public List<Product> getAllProducts() {
        log.debug("Fetching all products");
        return productRepository.findAll();
    }

    /**
     * Retrieve a product by its ID.
     */
    public Optional<Product> getProductById(Long id) {
        log.debug("Fetching product with id: {}", id);
        return productRepository.findById(id);
    }

    /**
     * Create a new product.
     */
    @Transactional
    public Product createProduct(ProductRequest request) {
        log.debug("Creating new product: {}", request.getName());

        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(BigDecimal.valueOf(request.getPrice()));
        product.setQuantity(request.getQuantity());

        Product savedProduct = productRepository.save(product);
        log.info("Created product with id: {}", savedProduct.getId());

        return savedProduct;
    }

    /**
     * Update an existing product.
     */
    @Transactional
    public Optional<Product> updateProduct(Long id, ProductRequest request) {
        log.debug("Updating product with id: {}", id);

        return productRepository.findById(id).map(product -> {
            product.setName(request.getName());
            product.setDescription(request.getDescription());
            product.setPrice(BigDecimal.valueOf(request.getPrice()));
            product.setQuantity(request.getQuantity());

            Product updatedProduct = productRepository.save(product);
            log.info("Updated product with id: {}", updatedProduct.getId());

            return updatedProduct;
        });
    }

    /**
     * Delete a product by its ID.
     */
    @Transactional
    public boolean deleteProduct(Long id) {
        log.debug("Deleting product with id: {}", id);

        if (productRepository.existsById(id)) {
            productRepository.deleteById(id);
            log.info("Deleted product with id: {}", id);
            return true;
        }

        log.warn("Product with id {} not found for deletion", id);
        return false;
    }
}
