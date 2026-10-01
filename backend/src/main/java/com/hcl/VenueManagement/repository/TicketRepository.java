package com.hcl.VenueManagement.repository;

import com.hcl.VenueManagement.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // Seat "taken" hai agar booking CONFIRMED hai,
    // ya PENDING_PAYMENT hai aur hold abhi expire nahi hua
    @Query("SELECT t.seat.id FROM Ticket t " +
           "WHERE t.booking.event.id = :eventId AND t.status <> 'CANCELLED' " +
           "AND (t.booking.status = 'CONFIRMED' " +
           "     OR (t.booking.status = 'PENDING_PAYMENT' AND t.booking.bookingDate > :holdCutoff))")
    List<Long> findBookedSeatIdsByEventId(@Param("eventId") Long eventId,
                                          @Param("holdCutoff") LocalDateTime holdCutoff);

    List<Ticket> findByBookingId(Long bookingId);
}
