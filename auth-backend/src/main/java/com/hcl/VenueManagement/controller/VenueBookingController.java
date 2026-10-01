package com.hcl.VenueManagement.controller;

import com.hcl.VenueManagement.dto.VenueBookingRequest;
import com.hcl.VenueManagement.dto.VenueBookingResponse;
import com.hcl.VenueManagement.service.VenueBookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/venue-bookings")
public class VenueBookingController {

    private final VenueBookingService venueBookingService;

    public VenueBookingController(VenueBookingService venueBookingService) {
        this.venueBookingService = venueBookingService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VenueBookingResponse book(@Valid @RequestBody VenueBookingRequest request) {
        return venueBookingService.book(request);
    }

    @GetMapping("/user/{userId}")
    public List<VenueBookingResponse> forUser(@PathVariable Long userId) {
        return venueBookingService.forUser(userId);
    }
}
