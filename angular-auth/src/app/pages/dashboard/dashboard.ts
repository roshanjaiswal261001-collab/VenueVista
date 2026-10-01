import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Api, BookingResponse, User, Venue, VenueEvent } from '../../services/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  user: User | null = null;
  venues: Venue[] = [];
  events: VenueEvent[] = [];
  bookings: BookingResponse[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      this.router.navigate(['/login']);
      return;
    }
    try {
      this.user = JSON.parse(storedUser) as User;
    } catch {
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
      return;
    }
    this.loadData();
  }

  loadData(): void {
    if (!this.user) {
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      venues: this.api.getVenues(),
      events: this.api.getEvents(),
      bookings: this.api.getMyBookings(this.user.id)
    }).subscribe({
      next: ({ venues, events, bookings }) => {
        this.venues = venues ?? [];
        this.events = events ?? [];
        this.bookings = bookings ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Dashboard loading error:', error);
        this.loading = false;
        this.errorMessage = 'Unable to load dashboard. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  get activeBookings(): number {
    return this.bookings.filter(b => b.status === 'CONFIRMED').length;
  }

  get upcomingEvents(): VenueEvent[] {
    const now = new Date();
    return this.events
      .filter(e => e.eventDate && new Date(e.eventDate) > now)
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      .slice(0, 4);
  }

  logout(): void {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}