package com.hcl.VenueManagement.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record BookingRequest(
        @NotNull(message = "userId is required")
        Long userId,

        @NotNull(message = "eventId is required")
        Long eventId,

        @NotEmpty(message = "Select at least one seat")
        List<Long> seatIds
) {
}