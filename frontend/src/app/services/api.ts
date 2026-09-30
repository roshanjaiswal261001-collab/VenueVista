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
  venue: { id: number };
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

  addEvent(event: CreateEventRequest): Observable<VenueEvent> {
    return this.http.post<VenueEvent>(`${API_BASE_URL}/events`, event);
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/events/${id}`);
  }
}