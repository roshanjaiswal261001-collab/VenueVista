package com.hcl.VenueManagement.controller;

import com.hcl.VenueManagement.dto.BookingResponse;
import com.hcl.VenueManagement.dto.PaymentRequest;
import com.hcl.VenueManagement.entity.Payment;
import com.hcl.VenueManagement.service.BookingService;
import com.hcl.VenueManagement.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final BookingService bookingService;

    public PaymentController(PaymentService paymentService, BookingService bookingService) {
        this.paymentService = paymentService;
        this.bookingService = bookingService;
    }

    // Booking ka payment karo -> booking CONFIRMED
    @PostMapping("/pay")
    public BookingResponse pay(@Valid @RequestBody PaymentRequest request) {
        return bookingService.payForBooking(request);
    }

    @GetMapping
    public List<Payment> getAllPayments() {
        return paymentService.getAllPayments();
    }

    @GetMapping("/{id}")
    public Payment getPaymentById(@PathVariable Long id) {
        return paymentService.getPaymentById(id);
    }
}
