package com.hcl.VenueManagement.repository;

import com.hcl.VenueManagement.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
}