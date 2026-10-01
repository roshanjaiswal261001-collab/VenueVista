package com.hcl.VenueManagement.service;

import com.hcl.VenueManagement.dto.VenueBookingRequest;
import com.hcl.VenueManagement.dto.VenueBookingResponse;
import com.hcl.VenueManagement.entity.User;
import com.hcl.VenueManagement.entity.Venue;
import com.hcl.VenueManagement.entity.VenueBooking;
import com.hcl.VenueManagement.repository.EventRepository;
import com.hcl.VenueManagement.repository.UserRepository;
import com.hcl.VenueManagement.repository.VenueBookingRepository;
import com.hcl.VenueManagement.repository.VenueRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class VenueBookingService {

    // Rent per day = capacity x 20 rupees
    public static final int RENT_PER_SEAT = 20;

    private final VenueBookingRepository venueBookingRepository;
    private final VenueRepository venueRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;

    public VenueBookingService(VenueBookingRepository venueBookingRepository,
                               VenueRepository venueRepository,
                               UserRepository userRepository,
                               EventRepository eventRepository) {
        this.venueBookingRepository = venueBookingRepository;
        this.venueRepository = venueRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
    }

    @Transactional
    public VenueBookingResponse book(VenueBookingRequest r) {
        Venue venue = venueRepository.findById(r.venueId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venue not found"));
        User user = userRepository.findById(r.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (r.guests() > venue.getCapacity()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Guests exceed venue capacity (" + venue.getCapacity() + ")");
        }
        if (venueBookingRepository.existsByVenueIdAndBookingDateAndStatus(venue.getId(), r.date(), "CONFIRMED")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Venue is already booked on this date");
        }
        if (eventRepository.existsByVenueIdAndEventDateBetween(venue.getId(),
                r.date().atStartOfDay(), r.date().plusDays(1).atStartOfDay())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "An event is already scheduled at this venue on this date");
        }

        double amount = (double) venue.getCapacity() * RENT_PER_SEAT;

        VenueBooking saved = venueBookingRepository.save(new VenueBooking(
                venue, user, r.date(), r.purpose().trim(), r.guests(), amount, r.paymentMethod(), "CONFIRMED"));

        return toResponse(saved);
    }

    public List<VenueBookingResponse> forUser(Long userId) {
        return venueBookingRepository.findByUserIdOrderByBookingDateDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    private VenueBookingResponse toResponse(VenueBooking b) {
        return new VenueBookingResponse(
                b.getId(),
                b.getVenue().getName(),
                b.getVenue().getLocation(),
                b.getBookingDate(),
                b.getGuests(),
                b.getPurpose(),
                b.getAmount(),
                b.getPaymentMethod(),
                b.getStatus()
        );
    }
}
