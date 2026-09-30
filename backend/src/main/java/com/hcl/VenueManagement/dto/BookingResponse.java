package com.hcl.VenueManagement.dto;

import java.time.LocalDateTime;
import java.util.List;

public record BookingResponse(
        Long bookingId,
        String status,
        double totalAmount,
        LocalDateTime bookingDate,
        Long eventId,
        String eventName,
        LocalDateTime eventDate,
        String venueName,
        List<TicketInfo> tickets
) {
    public record TicketInfo(
            String ticketNumber,
            String seat,
            String seatType,
            double price
    ) {
    }
}