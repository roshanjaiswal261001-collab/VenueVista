package com.hcl.VenueManagement.repository;

import com.hcl.VenueManagement.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // Kisi event ki kaunsi seats pehle se booked hain (cancelled ko chhod ke)
    @Query("SELECT t.seat.id FROM Ticket t " +
            "WHERE t.booking.event.id = :eventId AND t.status <> 'CANCELLED'")
    List<Long> findBookedSeatIdsByEventId(@Param("eventId") Long eventId);

    // Ek booking ke saare tickets
    List<Ticket> findByBookingId(Long bookingId);
}