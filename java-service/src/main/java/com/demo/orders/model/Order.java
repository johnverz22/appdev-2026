package com.demo.orders.model;

import jakarta.persistence.*;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The ID of the product in the PHP service's database.
    // There is no database foreign key here — these are separate databases.
    @Column(name = "product_id", nullable = false)
    private Long productId;

    // Snapshot of the product name at the time of ordering.
    // Even if the product is renamed later, the order still shows the original
    // name.
    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(nullable = false)
    private Integer quantity;

    // Snapshot of the product price at the time of ordering.
    @Column(nullable = false)
    private Double price;

    // ── Constructors ───────────────────────────────────────────
    public Order() {
    }

    public Order(Long productId, String productName, Integer quantity, Double price) {
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.price = price;
    }

    // ── Getters & Setters ──────────────────────────────────────
    public Long getId() {
        return id;
    }

    public Long getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public Double getPrice() {
        return price;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public void setPrice(Double price) {
        this.price = price;
    }
}
