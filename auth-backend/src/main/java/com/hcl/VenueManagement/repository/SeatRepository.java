package com.hcl.VenueManagement.repository;

import com.hcl.VenueManagement.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SeatRepository extends JpaRepository<Seat, Long> {

    // Ek venue ki saari seats
    List<Seat> findByVenueId(Long venueId);
}