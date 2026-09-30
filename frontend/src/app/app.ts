import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface Venue {
  id: number;
  name: string;
  location: string;
  capacity: number;
}

export interface VenueEvent {
  id: number;
  name: string;
  description: string;
  category: string;
  eventDate: string;
  ticketPrice: number;
  venue: Venue | null;
}

export interface CreateEventRequest {
  name: string;
  description: string;
  category: string;
  eventDate: string;
  ticketPrice: number;
  venueId: number;
}

export interface Seat {
  id: number;
  seatNumber: string;
  rowName: string;
  seatType: string;
}

export interface BookingRequest {
  userId: number;
  eventId: number;
  seatIds: number[];
}

export interface TicketInfo {
  ticketNumber: string;
  seat: string;
  seatType: string;
  price: number;
}

export interface BookingResponse {
  bookingId: number;
  status: string;
  totalAmount: number;
  bookingDate: string;
  eventId: number;
  eventName: string;
  eventDate: string;
  venueName: string | null;
  tickets: TicketInfo[];
}

// Angular's development proxy forwards /api requests to the Spring Boot API.
const API_BASE_URL = '/api';

@Injectable({
  providedIn: 'root',
})
export class Api {

  constructor(private readonly http: HttpClient) {}

  // ---------- Users ----------

  register(request: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${API_BASE_URL}/users/register`, request);
  }

  login(request: LoginRequest): Observable<User> {
    return this.http.post<User>(`${API_BASE_URL}/users/login`, request);
  }

  // ---------- Venues ----------

  getVenues(): Observable<Venue[]> {
    return this.http.get<Venue[]>(`${API_BASE_URL}/venues`);
  }

  addVenue(venue: Omit<Venue, 'id'>): Observable<Venue> {
    return this.http.post<Venue>(`${API_BASE_URL}/venues`, venue);
  }

  deleteVenue(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/venues/${id}`);
  }

  // ---------- Events ----------

  getEvents(): Observable<VenueEvent[]> {
    return this.http.get<VenueEvent[]>(`${API_BASE_URL}/events`);
  }

  getEventById(id: number): Observable<VenueEvent> {
    return this.http.get<VenueEvent>(`${API_BASE_URL}/events/${id}`);
  }

  addEvent(event: CreateEventRequest): Observable<VenueEvent> {
    return this.http.post<VenueEvent>(`${API_BASE_URL}/events`, event);
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/events/${id}`);
  }

  // ---------- Seats ----------

  getSeatsByVenue(venueId: number): Observable<Seat[]> {
    return this.http.get<Seat[]>(`${API_BASE_URL}/seats/venue/${venueId}`);
  }

  generateSeats(venueId: number, rows: number, seatsPerRow: number, vipRows: number): Observable<Seat[]> {
    return this.http.post<Seat[]>(
      `${API_BASE_URL}/seats/venue/${venueId}/generate`,
      null,
      { params: { rows, seatsPerRow, vipRows } }
    );
  }

  // ---------- Bookings ----------

  getBookedSeatIds(eventId: number): Observable<number[]> {
    return this.http.get<number[]>(`${API_BASE_URL}/bookings/event/${eventId}/booked-seats`);
  }

  bookSeats(request: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${API_BASE_URL}/bookings/book`, request);
  }

  getMyBookings(userId: number): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${API_BASE_URL}/bookings/user/${userId}`);
  }

  cancelBooking(bookingId: number, userId: number): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(
      `${API_BASE_URL}/bookings/${bookingId}/cancel`,
      null,
      { params: { userId } }
    );
  }
}