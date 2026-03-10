package com.demo.orders.controller;

import com.demo.orders.client.ProductClient;
import com.demo.orders.client.ProductDto;
import com.demo.orders.model.Order;
import com.demo.orders.repository.OrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderRepository repo;
    private final ProductClient productClient;

    public OrderController(OrderRepository repo, ProductClient productClient) {
        this.repo = repo;
        this.productClient = productClient;
    }

    // GET /orders — return all orders
    @GetMapping
    public List<Order> getAll() {
        return repo.findAll();
    }

    /**
     * POST /orders
     *
     * Expected request body:
     * { "productId": 1, "quantity": 2 }
     *
     * Flow:
     * 1. Call the PHP Products service to verify the product exists.
     * 2. Snapshot the product name and price from the response.
     * 3. Save the order with the snapshot data.
     *
     * This is the inter-service REST call pattern:
     * Orders service → GET /products/{id} → Products service
     */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        Long productId = Long.valueOf(body.get("productId").toString());
        Integer quantity = Integer.valueOf(body.get("quantity").toString());

        if (quantity < 1) {
            return ResponseEntity.badRequest().body(Map.of("error", "quantity must be at least 1"));
        }

        // ── Inter-service call ───────────────────────────────
        ProductDto product = productClient.findById(productId);

        if (product == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Product " + productId + " not found in products service"));
        }

        // ── Snapshot and persist ─────────────────────────────
        Order order = new Order(
                product.getId(),
                product.getName(), // snapshot — stable even if product is renamed later
                quantity,
                product.getPrice() // snapshot — stable even if price changes later
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(order));
    }
}
