package com.hcl.VenueManagement.controller;

import com.hcl.VenueManagement.entity.Seat;
import com.hcl.VenueManagement.service.SeatService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seats")
public class SeatController {

    private final SeatService seatService;

    public SeatController(SeatService seatService) {
        this.seatService = seatService;
    }

    @PostMapping
    public Seat addSeat(@RequestBody Seat seat) {
        return seatService.addSeat(seat);
    }

    @GetMapping
    public List<Seat> getAllSeats() {
        return seatService.getAllSeats();
    }

    @GetMapping("/{id}")
    public Seat getSeatById(@PathVariable Long id) {
        return seatService.getSeatById(id);
    }

    @DeleteMapping("/{id}")
    public void deleteSeat(@PathVariable Long id) {
        seatService.deleteSeat(id);
    }

    // Ek venue ki saari seats
    @GetMapping("/venue/{venueId}")
    public List<Seat> getSeatsByVenue(@PathVariable Long venueId) {
        return seatService.getSeatsByVenue(venueId);
    }

    // Venue ki seats ek saath generate karo
    // Example: POST /api/seats/venue/5/generate?rows=5&seatsPerRow=10&vipRows=1
    @PostMapping("/venue/{venueId}/generate")
    @ResponseStatus(HttpStatus.CREATED)
    public List<Seat> generateSeats(@PathVariable Long venueId,
                                    @RequestParam int rows,
                                    @RequestParam int seatsPerRow,
                                    @RequestParam(defaultValue = "0") int vipRows) {
        return seatService.generateSeats(venueId, rows, seatsPerRow, vipRows);
    }
}