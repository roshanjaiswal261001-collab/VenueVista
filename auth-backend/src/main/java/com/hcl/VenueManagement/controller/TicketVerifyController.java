package com.hcl.VenueManagement.controller;

import com.hcl.VenueManagement.dto.TicketVerifyResponse;
import com.hcl.VenueManagement.entity.*;
import com.hcl.VenueManagement.repository.TicketRepository;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/tickets/verify")
public class TicketVerifyController {

    private final TicketRepository ticketRepository;

    public TicketVerifyController(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    // Gate pe ticket check karo (kuch badalta nahi)
    @GetMapping("/{code}")
    public TicketVerifyResponse verify(@PathVariable String code) {
        return toResponse(find(code));
    }

    // Entry do: ticket USED ho jayega, dobara entry nahi milegi
    @PostMapping("/{code}/check-in")
    @Transactional
    public TicketVerifyResponse checkIn(@PathVariable String code) {
        Ticket ticket = find(code);
        String reason = invalidReason(ticket);
        if (reason != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, reason);
        }
        ticket.setStatus("USED");
        ticketRepository.save(ticket);

        TicketVerifyResponse r = toResponse(ticket);
        return new TicketVerifyResponse(r.ticketNumber(), true, r.status(),
                "Checked in. Allow entry.", r.eventName(), r.eventDate(),
                r.venueName(), r.seat(), r.seatType(), r.holderName());
    }

    private Ticket find(String code) {
        return ticketRepository.findByTicketNumber(code.trim().toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));
    }

    // null = valid, warna wajah
    private String invalidReason(Ticket ticket) {
        Booking booking = ticket.getBooking();
        Event event = booking.getEvent();

        if ("USED".equals(ticket.getStatus())) return "Ticket already used for entry";
        if ("CANCELLED".equals(ticket.getStatus())) return "Ticket was cancelled";
        if ("HELD".equals(ticket.getStatus()) || !"CONFIRMED".equals(booking.getStatus()))
            return "Payment not completed for this ticket";
        if (event.getEventDate() != null && event.getEventDate().toLocalDate().isBefore(LocalDate.now()))
            return "This event is already over";
        return null;
    }

    private TicketVerifyResponse toResponse(Ticket ticket) {
        Booking booking = ticket.getBooking();
        Event event = booking.getEvent();
        Seat seat = ticket.getSeat();
        String reason = invalidReason(ticket);

        return new TicketVerifyResponse(
                ticket.getTicketNumber(),
                reason == null,
                ticket.getStatus(),
                reason == null ? "Valid ticket. Ready for check-in." : reason,
                event.getName(),
                event.getEventDate(),
                event.getVenue() != null ? event.getVenue().getName() : null,
                (seat.getRowName() == null ? "" : seat.getRowName()) + seat.getSeatNumber(),
                seat.getSeatType(),
                booking.getUser().getName()
        );
    }
}
