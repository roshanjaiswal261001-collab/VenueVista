package com.hcl.VenueManagement.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "venue_bookings")
public class VenueBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "venue_id")
    private Venue venue;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private LocalDate bookingDate;
    private String purpose;
    private int guests;
    private double amount;
    private String paymentMethod;
    private String status;
    private LocalDateTime createdAt;

    public VenueBooking() {
    }

    public VenueBooking(Venue venue, User user, LocalDate bookingDate, String purpose,
                        int guests, double amount, String paymentMethod, String status) {
        this.venue = venue;
        this.user = user;
        this.bookingDate = bookingDate;
        this.purpose = purpose;
        this.guests = guests;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Venue getVenue() { return venue; }
    public User getUser() { return user; }
    public LocalDate getBookingDate() { return bookingDate; }
    public String getPurpose() { return purpose; }
    public int getGuests() { return guests; }
    public double getAmount() { return amount; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setStatus(String status) { this.status = status; }
}
