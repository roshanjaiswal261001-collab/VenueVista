package com.hcl.VenueManagement.repository;

import com.hcl.VenueManagement.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {
}