package com.hcl.VenueManagement.repository;

import com.hcl.VenueManagement.entity.VenueBooking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface VenueBookingRepository extends JpaRepository<VenueBooking, Long> {

    boolean existsByVenueIdAndBookingDateAndStatus(Long venueId, LocalDate bookingDate, String status);

    List<VenueBooking> findByUserIdOrderByBookingDateDesc(Long userId);
}
