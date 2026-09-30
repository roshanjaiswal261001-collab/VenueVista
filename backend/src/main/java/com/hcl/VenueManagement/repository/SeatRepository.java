package com.hcl.VenueManagement.repository;

import com.hcl.VenueManagement.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SeatRepository extends JpaRepository<Seat, Long> {
}