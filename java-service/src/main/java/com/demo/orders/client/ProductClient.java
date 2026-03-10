package com.demo.orders.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

/**
 * Calls the PHP Products service over REST.
 *
 * This is the inter-service communication pattern:
 * Orders service → HTTP GET → Products service
 *
 * The URL is injected from an environment variable so it is easy
 * to change across environments (Docker, local, production).
 */
@Component
public class ProductClient {

    private final RestTemplate restTemplate;

    @Value("${product.service.url}")
    private String productServiceUrl;

    public ProductClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Fetch a single product by ID from the PHP service.
     * Returns null if the product does not exist (404).
     */
    public ProductDto findById(Long id) {
        try {
            return restTemplate.getForObject(
                    productServiceUrl + "/products/" + id,
                    ProductDto.class);
        } catch (HttpClientErrorException.NotFound e) {
            return null; // product does not exist
        }
    }
}
