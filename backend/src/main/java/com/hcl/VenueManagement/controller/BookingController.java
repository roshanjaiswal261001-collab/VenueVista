package com.hcl.VenueManagement.controller;

import com.hcl.VenueManagement.dto.BookingRequest;
import com.hcl.VenueManagement.dto.BookingResponse;
import com.hcl.VenueManagement.entity.Booking;
import com.hcl.VenueManagement.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // Naya safe booking: frontend sirf userId, eventId, seatIds bhejta hai
    @PostMapping("/book")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse book(@Valid @RequestBody BookingRequest request) {
        return bookingService.createBooking(request);
    }

    // Ek user ki saari bookings
    @GetMapping("/user/{userId}")
    public List<BookingResponse> getUserBookings(@PathVariable Long userId) {
        return bookingService.getBookingsForUser(userId);
    }

    // Kisi event ki booked seats (seat map pe grey dikhane ke liye)
    @GetMapping("/event/{eventId}/booked-seats")
    public List<Long> getBookedSeats(@PathVariable Long eventId) {
        return bookingService.getBookedSeatIds(eventId);
    }

    // Booking cancel karna
    @PutMapping("/{id}/cancel")
    public BookingResponse cancel(@PathVariable Long id, @RequestParam Long userId) {
        return bookingService.cancelBooking(id, userId);
    }

    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingService.getAllBookings();
    }

    @GetMapping("/{id}")
    public Booking getBookingById(@PathVariable Long id) {
        return bookingService.getBookingById(id);
    }

    @DeleteMapping("/{id}")
    public void deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
    }
}