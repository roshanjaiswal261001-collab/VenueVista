package com.hcl.VenueManagement.repository;

import com.hcl.VenueManagement.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface EventRepository extends JpaRepository<Event, Long> {

    // Kya us din is venue pe koi event hai?
    boolean existsByVenueIdAndEventDateBetween(Long venueId, LocalDateTime start, LocalDateTime end);
}
