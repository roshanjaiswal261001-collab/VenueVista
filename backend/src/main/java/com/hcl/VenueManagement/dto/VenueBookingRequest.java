package com.hcl.VenueManagement.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record VenueBookingRequest(
        @NotNull(message = "venueId is required") Long venueId,
        @NotNull(message = "userId is required") Long userId,
        @NotNull(message = "Date is required")
        @Future(message = "Date must be in the future") LocalDate date,
        @Min(value = 1, message = "At least 1 guest") int guests,
        @NotBlank(message = "Purpose is required") String purpose,
        @NotBlank
        @Pattern(regexp = "UPI|CARD|CASH", message = "Method must be UPI, CARD or CASH") String paymentMethod
) {
}
