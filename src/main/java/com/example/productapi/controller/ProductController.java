package com.example.productapi.controller;

import com.example.productapi.api.ProductsApi;
import com.example.productapi.entity.Product;
import com.example.productapi.model.ProductRequest;
import com.example.productapi.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller implementing the OpenAPI-generated ProductsApi interface.
 * This demonstrates the contract-first approach where the API contract
 * (OpenAPI spec) drives the implementation.
 */
@RestController
@RequiredArgsConstructor
@Slf4j
public class ProductController implements ProductsApi {

    private final ProductService productService;

    @Override
    public ResponseEntity<List<com.example.productapi.model.Product>> getAllProducts() {
        log.info("GET /products - Fetching all products");

        List<Product> products = productService.getAllProducts();
        List<com.example.productapi.model.Product> response = products.stream()
                .map(this::toApiModel)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<com.example.productapi.model.Product> getProductById(Long id) {
        log.info("GET /products/{} - Fetching product by id", id);

        return productService.getProductById(id)
                .map(product -> ResponseEntity.ok(toApiModel(product)))
                .orElseGet(() -> {
                    log.warn("Product with id {} not found", id);
                    return ResponseEntity.notFound().build();
                });
    }

    @Override
    public ResponseEntity<com.example.productapi.model.Product> createProduct(ProductRequest productRequest) {
        log.info("POST /products - Creating new product: {}", productRequest.getName());

        Product createdProduct = productService.createProduct(productRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(toApiModel(createdProduct));
    }

    @Override
    public ResponseEntity<com.example.productapi.model.Product> updateProduct(Long id, ProductRequest productRequest) {
        log.info("PUT /products/{} - Updating product", id);

        return productService.updateProduct(id, productRequest)
                .map(product -> ResponseEntity.ok(toApiModel(product)))
                .orElseGet(() -> {
                    log.warn("Product with id {} not found for update", id);
                    return ResponseEntity.notFound().build();
                });
    }

    @Override
    public ResponseEntity<Void> deleteProduct(Long id) {
        log.info("DELETE /products/{} - Deleting product", id);

        boolean deleted = productService.deleteProduct(id);

        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            log.warn("Product with id {} not found for deletion", id);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Convert JPA Entity to OpenAPI-generated API model.
     */
    private com.example.productapi.model.Product toApiModel(Product entity) {
        com.example.productapi.model.Product apiModel = new com.example.productapi.model.Product();
        apiModel.setId(entity.getId());
        apiModel.setName(entity.getName());
        apiModel.setDescription(entity.getDescription());
        apiModel.setPrice(entity.getPrice().doubleValue());
        apiModel.setQuantity(entity.getQuantity());
        return apiModel;
    }
}
