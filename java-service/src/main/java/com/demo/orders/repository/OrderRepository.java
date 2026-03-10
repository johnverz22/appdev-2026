package com.demo.orders.repository;

import com.demo.orders.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

// Spring Data JPA generates the SQL automatically.
// We get findAll() and save() for free — no boilerplate needed.
public interface OrderRepository extends JpaRepository<Order, Long> {
}
