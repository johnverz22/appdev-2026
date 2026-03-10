package com.demo.orders;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class OrdersApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrdersApplication.class, args);
    }

    /**
     * Register RestTemplate as a Spring bean so it can be injected
     * into ProductClient. RestTemplate is the simplest HTTP client
     * in Spring — good for teaching purposes.
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
