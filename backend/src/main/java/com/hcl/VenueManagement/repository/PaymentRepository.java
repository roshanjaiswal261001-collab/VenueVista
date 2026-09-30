package com.hcl.VenueManagement.repository;

import com.hcl.VenueManagement.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
}