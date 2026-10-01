package com.hcl.VenueManagement.service;

import com.hcl.VenueManagement.entity.Seat;
import com.hcl.VenueManagement.entity.Venue;
import com.hcl.VenueManagement.repository.SeatRepository;
import com.hcl.VenueManagement.repository.VenueRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
public class SeatService {

    private final SeatRepository seatRepository;
    private final VenueRepository venueRepository;

    public SeatService(SeatRepository seatRepository, VenueRepository venueRepository) {
        this.seatRepository = seatRepository;
        this.venueRepository = venueRepository;
    }

    public Seat addSeat(Seat seat) {
        return seatRepository.save(seat);
    }

    public List<Seat> getAllSeats() {
        return seatRepository.findAll();
    }

    public Seat getSeatById(Long id) {
        return seatRepository.findById(id).orElse(null);
    }

    public void deleteSeat(Long id) {
        seatRepository.deleteById(id);
    }

    // Ek venue ki saari seats
    public List<Seat> getSeatsByVenue(Long venueId) {
        return seatRepository.findByVenueId(venueId);
    }

    // Venue ke liye rows x seatsPerRow seats banao.
    // Pehli 'vipRows' rows VIP hongi, baaki REGULAR.
    @Transactional
    public List<Seat> generateSeats(Long venueId, int rows, int seatsPerRow, int vipRows) {

        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Venue not found"));

        if (rows < 1 || rows > 26) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Rows must be between 1 and 26 (A to Z)");
        }
        if (seatsPerRow < 1 || seatsPerRow > 50) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Seats per row must be between 1 and 50");
        }
        if (vipRows < 0 || vipRows > rows) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "VIP rows must be between 0 and total rows");
        }
        if (rows * seatsPerRow > venue.getCapacity()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Total seats (" + rows * seatsPerRow + ") exceed venue capacity ("
                            + venue.getCapacity() + ")");
        }
        if (!seatRepository.findByVenueId(venueId).isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Seats already exist for this venue");
        }

        List<Seat> seats = new ArrayList<>();
        for (int r = 0; r < rows; r++) {
            String rowName = String.valueOf((char) ('A' + r));
            String type = r < vipRows ? "VIP" : "REGULAR";
            for (int n = 1; n <= seatsPerRow; n++) {
                seats.add(new Seat(String.valueOf(n), rowName, type, venue));
            }
        }
        return seatRepository.saveAll(seats);
    }
}