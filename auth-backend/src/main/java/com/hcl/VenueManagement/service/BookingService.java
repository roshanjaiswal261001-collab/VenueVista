package com.hcl.VenueManagement.service;

import com.hcl.VenueManagement.dto.BookingRequest;
import com.hcl.VenueManagement.dto.BookingResponse;
import com.hcl.VenueManagement.dto.PaymentRequest;
import com.hcl.VenueManagement.entity.*;
import com.hcl.VenueManagement.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class BookingService {

    // Payment ke liye seats kitni der hold rahengi
    public static final int HOLD_MINUTES = 10;

    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final SeatRepository seatRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    public BookingService(BookingRepository bookingRepository,
                          TicketRepository ticketRepository,
                          SeatRepository seatRepository,
                          EventRepository eventRepository,
                          UserRepository userRepository,
                          PaymentRepository paymentRepository) {
        this.bookingRepository = bookingRepository;
        this.ticketRepository = ticketRepository;
        this.seatRepository = seatRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
    }

    // ================= STEP 1: SEATS HOLD KARO =================

    @Transactional
    public BookingResponse createBooking(BookingRequest request) {

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Event event = eventRepository.findById(request.eventId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        if (event.getVenue() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This event has no venue assigned");
        }
        if (event.getEventDate() != null && event.getEventDate().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This event has already happened");
        }

        Set<Long> uniqueSeatIds = new LinkedHashSet<>(request.seatIds());
        List<Seat> seats = seatRepository.findAllById(uniqueSeatIds);
        if (seats.size() != uniqueSeatIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more seats do not exist");
        }

        Long venueId = event.getVenue().getId();
        for (Seat seat : seats) {
            if (seat.getVenue() == null || !seat.getVenue().getId().equals(venueId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Seat " + seatLabel(seat) + " does not belong to this venue");
            }
        }

        Set<Long> taken = new HashSet<>(
                ticketRepository.findBookedSeatIdsByEventId(event.getId(), holdCutoff()));
        for (Seat seat : seats) {
            if (taken.contains(seat.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Seat " + seatLabel(seat) + " is already booked");
            }
        }

        double pricePerSeat = event.getTicketPrice();
        double total = pricePerSeat * seats.size();

        Booking booking = bookingRepository.save(
                new Booking(LocalDateTime.now(), total, "PENDING_PAYMENT", user, event));

        List<Ticket> tickets = new ArrayList<>();
        for (Seat seat : seats) {
            String ticketNumber = "TKT-" + booking.getId() + "-" + seatLabel(seat) + "-" + randomCode();
            tickets.add(new Ticket(ticketNumber, pricePerSeat, "HELD", booking, seat));
        }
        ticketRepository.saveAll(tickets);

        return toResponse(booking, tickets);
    }

    // ================= STEP 2: PAYMENT =================

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public BookingResponse payForBooking(PaymentRequest request) {

        Booking booking = getOwnedBooking(request.bookingId(), request.userId());
        List<Ticket> tickets = ticketRepository.findByBookingId(booking.getId());

        if ("CONFIRMED".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This booking is already paid");
        }
        if ("CANCELLED".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This booking was cancelled");
        }
        if (isHoldExpired(booking)) {
            expire(booking, tickets);   // seats free, aur yeh change save rahega
            throw new ResponseStatusException(HttpStatus.GONE,
                    "Your seat hold expired. Please book again.");
        }
        if (paymentRepository.existsByBookingId(booking.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Payment already recorded");
        }

        // Amount hamesha booking se, frontend se nahi
        paymentRepository.save(new Payment(
                booking.getTotalAmount(), request.paymentMethod(), "SUCCESS",
                LocalDateTime.now(), booking));

        booking.setStatus("CONFIRMED");
        bookingRepository.save(booking);

        for (Ticket t : tickets) {
            t.setStatus("ACTIVE");
        }
        ticketRepository.saveAll(tickets);

        return toResponse(booking, tickets);
    }

    // ================= READ =================

    @Transactional
    public BookingResponse getBookingDetails(Long bookingId, Long userId) {
        Booking booking = getOwnedBooking(bookingId, userId);
        List<Ticket> tickets = ticketRepository.findByBookingId(bookingId);
        if (isHoldExpired(booking)) {
            expire(booking, tickets);
        }
        return toResponse(booking, tickets);
    }

    @Transactional
    public List<BookingResponse> getBookingsForUser(Long userId) {
        List<BookingResponse> result = new ArrayList<>();
        for (Booking booking : bookingRepository.findByUserIdOrderByBookingDateDesc(userId)) {
            List<Ticket> tickets = ticketRepository.findByBookingId(booking.getId());
            if (isHoldExpired(booking)) {
                expire(booking, tickets);
            }
            result.add(toResponse(booking, tickets));
        }
        return result;
    }

    public List<Long> getBookedSeatIds(Long eventId) {
        return ticketRepository.findBookedSeatIdsByEventId(eventId, holdCutoff());
    }

    // ================= CANCEL =================

    @Transactional
    public BookingResponse cancelBooking(Long bookingId, Long userId) {
        Booking booking = getOwnedBooking(bookingId, userId);

        if ("CANCELLED".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking is already cancelled");
        }

        List<Ticket> tickets = ticketRepository.findByBookingId(bookingId);
        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);
        for (Ticket t : tickets) {
            t.setStatus("CANCELLED");
        }
        ticketRepository.saveAll(tickets);

        paymentRepository.findByBookingId(bookingId).ifPresent(p -> {
            p.setPaymentStatus("REFUNDED");
            paymentRepository.save(p);
        });

        return toResponse(booking, tickets);
    }

    // ================= OLD BASIC METHODS =================

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id).orElse(null);
    }

    public void deleteBooking(Long id) {
        bookingRepository.deleteById(id);
    }

    // ================= HELPERS =================

    private LocalDateTime holdCutoff() {
        return LocalDateTime.now().minusMinutes(HOLD_MINUTES);
    }

    private Booking getOwnedBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        if (!booking.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This is not your booking");
        }
        return booking;
    }

    private boolean isHoldExpired(Booking booking) {
        return "PENDING_PAYMENT".equals(booking.getStatus())
                && booking.getBookingDate().isBefore(holdCutoff());
    }

    private void expire(Booking booking, List<Ticket> tickets) {
        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);
        for (Ticket t : tickets) {
            t.setStatus("CANCELLED");
        }
        ticketRepository.saveAll(tickets);
    }

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    // Ticket code ka random hissa, taaki koi guess na kar sake
    private String randomCode() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
        }
        return sb.toString();
    }

    private String seatLabel(Seat seat) {
        String row = seat.getRowName() == null ? "" : seat.getRowName();
        return row + seat.getSeatNumber();
    }

    private BookingResponse toResponse(Booking booking, List<Ticket> tickets) {
        Event event = booking.getEvent();

        List<BookingResponse.TicketInfo> infos = new ArrayList<>();
        for (Ticket t : tickets) {
            infos.add(new BookingResponse.TicketInfo(
                    t.getTicketNumber(), seatLabel(t.getSeat()), t.getSeat().getSeatType(), t.getPrice()));
        }

        LocalDateTime holdExpiresAt = "PENDING_PAYMENT".equals(booking.getStatus())
                ? booking.getBookingDate().plusMinutes(HOLD_MINUTES)
                : null;

        return new BookingResponse(
                booking.getId(),
                booking.getStatus(),
                booking.getTotalAmount(),
                booking.getBookingDate(),
                holdExpiresAt,
                event.getId(),
                event.getName(),
                event.getEventDate(),
                event.getVenue() != null ? event.getVenue().getName() : null,
                infos
        );
    }
}
