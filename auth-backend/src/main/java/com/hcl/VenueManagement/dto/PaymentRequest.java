package com.hcl.VenueManagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record PaymentRequest(
        @NotNull(message = "bookingId is required")
        Long bookingId,

        @NotNull(message = "userId is required")
        Long userId,

        @NotBlank(message = "Payment method is required")
        @Pattern(regexp = "UPI|CARD|CASH|NET_BANKING", message = "Method must be UPI, CARD or CASH")
        String paymentMethod
) {
}
