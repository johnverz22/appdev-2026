package com.demo.orders.client;

// Data Transfer Object — mirrors the JSON shape returned by the PHP service
public class ProductDto {
    private Long id;
    private String name;
    private Double price;

    public ProductDto() {
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Double getPrice() {
        return price;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setPrice(Double p) {
        this.price = p;
    }
}
