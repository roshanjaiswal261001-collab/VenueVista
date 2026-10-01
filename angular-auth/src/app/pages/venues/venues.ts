import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api, PaymentMethod, User, Venue } from '../../services/api';

@Component({
  selector: 'app-venues',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './venues.html',
  styleUrl: './venues.css'
})
export class Venues implements OnInit {
  user: User | null = null;
  venues: Venue[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  // Seat generator (admin)
  openGeneratorId: number | null = null;
  generating = false;
  seatForm = { rows: 5, seatsPerRow: 10, vipRows: 1 };


  newVenue = {
    name: '',
    location: '',
    capacity: 0
  };

  constructor(
    private api: Api,
    private router: Router,
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
    this.loadVenues();
  }

  loadVenues(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.getVenues().subscribe({
      next: (response) => {
        this.venues = Array.isArray(response) ? response : [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Venue loading error:', error);
        this.loading = false;
        this.errorMessage = 'Unable to load venues. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  addVenue(): void {
    const { name, location, capacity } = this.newVenue;

    if (!name.trim() || !location.trim() || capacity <= 0) {
      this.errorMessage = 'Please fill all fields. Capacity must be more than 0.';
      this.successMessage = '';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.addVenue({
      name: name.trim(),
      location: location.trim(),
      capacity
    }).subscribe({
      next: (venue) => {
        this.venues = [...this.venues, venue];
        this.newVenue = { name: '', location: '', capacity: 0 };
        this.saving = false;
        this.successMessage = `"${venue.name}" added successfully.`;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Add venue error:', error);
        this.saving = false;
        this.errorMessage = 'Could not add venue. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  deleteVenue(venue: Venue): void {
    if (!confirm(`Delete "${venue.name}"?`)) {
      return;
    }

    this.api.deleteVenue(venue.id).subscribe({
      next: () => {
        this.venues = this.venues.filter(v => v.id !== venue.id);
        this.successMessage = `"${venue.name}" deleted.`;
        this.errorMessage = '';
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Delete venue error:', error);
        this.errorMessage = 'Could not delete venue. It may be linked to events.';
        this.successMessage = '';
        this.cdr.markForCheck();
      }
    });
  }

  // ---------- Venue booking (customer) ----------
  bookingVenueId: number | null = null;
  bookingInProgress = false;
  venueForm = { date: '', guests: 50, purpose: 'Wedding' };
  purposes = ['Wedding', 'Party', 'Conference', 'Birthday', 'Other'];
  readonly RENT_PER_SEAT = 20;

  get minDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  openVenueBooking(venue: Venue): void {
    this.bookingVenueId = venue.id;
    this.venueForm = { date: '', guests: Math.min(50, venue.capacity), purpose: 'Wedding' };
    this.errorMessage = '';
    this.successMessage = '';
  }

  bookVenue(venue: Venue, method: PaymentMethod): void {
    if (!this.user) {
      return;
    }
    const { date, guests, purpose } = this.venueForm;
    if (!date) {
      this.errorMessage = 'Please choose a date.';
      return;
    }
    if (guests < 1 || guests > venue.capacity) {
      this.errorMessage = `Guests must be between 1 and ${venue.capacity}.`;
      return;
    }

    this.bookingInProgress = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.bookVenue({ venueId: venue.id, userId: this.user.id, date, guests, purpose, paymentMethod: method })
      .subscribe({
        next: (b) => {
          this.bookingInProgress = false;
          this.bookingVenueId = null;
          this.successMessage = `Payment successful! "${b.venueName}" is booked for ${b.date} (Rs ${b.amount} via ${b.paymentMethod}).`;
          window.scrollTo({ top: 0, behavior: 'smooth' });
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.bookingInProgress = false;
          this.errorMessage = error?.error?.message
            || (error?.status === 409 ? 'Venue is not available on this date.' : 'Could not book venue.');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          this.cdr.markForCheck();
        }
      });
  }

  openGenerator(venue: Venue): void {
    const seatsPerRow = Math.min(10, venue.capacity);
    const rows = Math.max(1, Math.min(5, Math.floor(venue.capacity / seatsPerRow)));
    this.seatForm = { rows, seatsPerRow, vipRows: rows > 1 ? 1 : 0 };
    this.openGeneratorId = venue.id;
    this.errorMessage = '';
    this.successMessage = '';
  }

  generateSeats(venue: Venue): void {
    const { rows, seatsPerRow, vipRows } = this.seatForm;

    if (rows < 1 || rows > 26 || seatsPerRow < 1 || seatsPerRow > 50) {
      this.errorMessage = 'Rows must be 1-26 and seats per row 1-50.';
      return;
    }
    if (vipRows < 0 || vipRows > rows) {
      this.errorMessage = 'VIP rows must be between 0 and total rows.';
      return;
    }
    if (rows * seatsPerRow > venue.capacity) {
      this.errorMessage = `Total seats (${rows * seatsPerRow}) exceed capacity (${venue.capacity}).`;
      return;
    }

    this.generating = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.generateSeats(venue.id, rows, seatsPerRow, vipRows).subscribe({
      next: (seats) => {
        this.generating = false;
        this.openGeneratorId = null;
        this.successMessage = `${seats.length} seats created for "${venue.name}".`;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Generate seats error:', error);
        this.generating = false;
        this.errorMessage = error?.status === 409
          ? `Seats already exist for "${venue.name}".`
          : (error?.error?.message || 'Could not generate seats. Please try again.');
        this.cdr.markForCheck();
      }
    });
  }

  get isAdmin(): boolean {
    return this.user?.role === 'ADMIN';
  }

  logout(): void {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}