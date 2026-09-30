package com.hcl.VenueManagement.repository;

import com.hcl.VenueManagement.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Ek user ki saari bookings, nayi sabse upar
    List<Booking> findByUserIdOrderByBookingDateDesc(Long userId);
}