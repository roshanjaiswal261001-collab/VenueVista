package com.hcl.VenueManagement.repository;

import com.hcl.VenueManagement.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByBookingId(Long bookingId);

    boolean existsByBookingId(Long bookingId);
}
