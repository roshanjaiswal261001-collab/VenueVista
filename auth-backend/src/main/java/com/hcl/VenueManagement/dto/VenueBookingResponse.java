package com.hcl.VenueManagement.dto;

import java.time.LocalDate;

public record VenueBookingResponse(
        Long id,
        String venueName,
        String location,
        LocalDate date,
        int guests,
        String purpose,
        double amount,
        String paymentMethod,
        String status
) {
}
