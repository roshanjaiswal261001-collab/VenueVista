package com.hcl.VenueManagement.service;

import com.hcl.VenueManagement.dto.EventRequest;
import com.hcl.VenueManagement.entity.Event;
import com.hcl.VenueManagement.entity.Venue;
import com.hcl.VenueManagement.repository.EventRepository;
import com.hcl.VenueManagement.repository.VenueRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;

    public EventService(EventRepository eventRepository, VenueRepository venueRepository) {
        this.eventRepository = eventRepository;
        this.venueRepository = venueRepository;
    }

    // Naya event: frontend sirf venueId bhejta hai, venue hum khud dhoondhte hain
    public Event createEvent(EventRequest request) {

        Venue venue = venueRepository.findById(request.venueId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Venue not found"));

        if (request.eventDate().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Event date must be in the future");
        }

        Event event = new Event(
                request.name().trim(),
                request.description() == null ? "" : request.description().trim(),
                request.category().trim(),
                request.eventDate(),
                request.ticketPrice(),
                venue
        );

        return eventRepository.save(event);
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public Event getEventById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Event not found"));
    }

    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }
}