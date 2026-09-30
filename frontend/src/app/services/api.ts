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

// Angular's development proxy forwards /api requests to the Spring Boot API.
const API_BASE_URL = '/api';

@Injectable({
  providedIn: 'root',
})
export class Api {

  constructor(private readonly http: HttpClient) {}

  register(request: RegisterRequest): Observable<User> {
    return this.http.post<User>(
      `${API_BASE_URL}/users/register`,
      request
    );
  }

  login(request: LoginRequest): Observable<User> {
    return this.http.post<User>(
      `${API_BASE_URL}/users/login`,
      request
    );
  }

  getVenues(): Observable<Venue[]> {
    return this.http.get<Venue[]>(
      `${API_BASE_URL}/venues`
    );
  }
}
