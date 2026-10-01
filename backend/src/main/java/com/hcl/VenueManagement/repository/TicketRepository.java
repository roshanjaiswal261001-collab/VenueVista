package com.hcl.VenueManagement.repository;

import com.hcl.VenueManagement.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    @Query("SELECT t.seat.id FROM Ticket t " +
           "WHERE t.booking.event.id = :eventId AND t.status <> 'CANCELLED' " +
           "AND (t.booking.status = 'CONFIRMED' " +
           "     OR (t.booking.status = 'PENDING_PAYMENT' AND t.booking.bookingDate > :holdCutoff))")
    List<Long> findBookedSeatIdsByEventId(@Param("eventId") Long eventId,
                                          @Param("holdCutoff") LocalDateTime holdCutoff);

    List<Ticket> findByBookingId(Long bookingId);

    Optional<Ticket> findByTicketNumber(String ticketNumber);
}
