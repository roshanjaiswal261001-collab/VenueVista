package com.hcl.VenueManagement.dto;

import java.time.LocalDateTime;

public record TicketVerifyResponse(
        String ticketNumber,
        boolean valid,
        String status,
        String message,
        String eventName,
        LocalDateTime eventDate,
        String venueName,
        String seat,
        String seatType,
        String holderName
) {
}
