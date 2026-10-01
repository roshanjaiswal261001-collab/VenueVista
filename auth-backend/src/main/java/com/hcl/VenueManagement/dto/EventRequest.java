package com.hcl.VenueManagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.LocalDateTime;

public record EventRequest(
        @NotBlank(message = "Event name is required")
        String name,

        String description,

        @NotBlank(message = "Category is required")
        String category,

        @NotNull(message = "Event date is required")
        LocalDateTime eventDate,

        @PositiveOrZero(message = "Ticket price cannot be negative")
        double ticketPrice,

        @NotNull(message = "venueId is required")
        Long venueId
) {
}