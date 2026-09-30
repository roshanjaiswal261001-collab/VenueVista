package com.hcl.VenueManagement.service;

import com.hcl.VenueManagement.dto.BookingRequest;
import com.hcl.VenueManagement.dto.BookingResponse;
import com.hcl.VenueManagement.entity.*;
import com.hcl.VenueManagement.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final SeatRepository seatRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public BookingService(BookingRepository bookingRepository,
                          TicketRepository ticketRepository,
                          SeatRepository seatRepository,
                          EventRepository eventRepository,
                          UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.ticketRepository = ticketRepository;
        this.seatRepository = seatRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    // ================= SAFE BOOKING =================

    @Transactional
    public BookingResponse createBooking(BookingRequest request) {

        // 1. User aur Event exist karte hain?
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Event event = eventRepository.findById(request.eventId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Event not found"));

        if (event.getVenue() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "This event has no venue assigned");
        }

        if (event.getEventDate() != null && event.getEventDate().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "This event has already happened");
        }

        // 2. Duplicate seat IDs hatao, aur seats load karo
        Set<Long> uniqueSeatIds = new LinkedHashSet<>(request.seatIds());
        List<Seat> seats = seatRepository.findAllById(uniqueSeatIds);

        if (seats.size() != uniqueSeatIds.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "One or more seats do not exist");
        }

        // 3. Saari seats isi event ke venue ki honi chahiye
        Long venueId = event.getVenue().getId();
        for (Seat seat : seats) {
            if (seat.getVenue() == null || !seat.getVenue().getId().equals(venueId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Seat " + seatLabel(seat) + " does not belong to this venue");
            }
        }

        // 4. Koi seat pehle se booked toh nahi?
        Set<Long> alreadyBooked = new HashSet<>(
                ticketRepository.findBookedSeatIdsByEventId(event.getId()));

        for (Seat seat : seats) {
            if (alreadyBooked.contains(seat.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Seat " + seatLabel(seat) + " is already booked");
            }
        }

        // 5. Price backend khud calculate karega (frontend pe bharosa nahi)
        double pricePerSeat = event.getTicketPrice();
        double total = pricePerSeat * seats.size();

        // 6. Booking save karo
        Booking booking = new Booking(
                LocalDateTime.now(), total, "CONFIRMED", user, event);
        booking = bookingRepository.save(booking);

        // 7. Har seat ka ek ticket
        List<Ticket> tickets = new ArrayList<>();
        for (Seat seat : seats) {
            String ticketNumber = "TKT-" + booking.getId() + "-" + seatLabel(seat);
            tickets.add(new Ticket(ticketNumber, pricePerSeat, "ACTIVE", booking, seat));
        }
        ticketRepository.saveAll(tickets);

        return toResponse(booking, tickets);
    }

    // ================= READ =================

    public List<BookingResponse> getBookingsForUser(Long userId) {
        List<Booking> bookings = bookingRepository.findByUserIdOrderByBookingDateDesc(userId);
        List<BookingResponse> result = new ArrayList<>();
        for (Booking booking : bookings) {
            result.add(toResponse(booking, ticketRepository.findByBookingId(booking.getId())));
        }
        return result;
    }

    public List<Long> getBookedSeatIds(Long eventId) {
        return ticketRepository.findBookedSeatIdsByEventId(eventId);
    }

    // ================= CANCEL =================

    @Transactional
    public BookingResponse cancelBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You can only cancel your own booking");
        }

        if ("CANCELLED".equals(booking.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Booking is already cancelled");
        }

        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);

        List<Ticket> tickets = ticketRepository.findByBookingId(bookingId);
        for (Ticket ticket : tickets) {
            ticket.setStatus("CANCELLED");   // seats phir se free ho jayengi
        }
        ticketRepository.saveAll(tickets);

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

    private String seatLabel(Seat seat) {
        String row = seat.getRowName() == null ? "" : seat.getRowName();
        return row + seat.getSeatNumber();
    }

    private BookingResponse toResponse(Booking booking, List<Ticket> tickets) {
        Event event = booking.getEvent();

        List<BookingResponse.TicketInfo> ticketInfos = new ArrayList<>();
        for (Ticket t : tickets) {
            ticketInfos.add(new BookingResponse.TicketInfo(
                    t.getTicketNumber(),
                    seatLabel(t.getSeat()),
                    t.getSeat().getSeatType(),
                    t.getPrice()
            ));
        }

        return new BookingResponse(
                booking.getId(),
                booking.getStatus(),
                booking.getTotalAmount(),
                booking.getBookingDate(),
                event.getId(),
                event.getName(),
                event.getEventDate(),
                event.getVenue() != null ? event.getVenue().getName() : null,
                ticketInfos
        );
    }
}