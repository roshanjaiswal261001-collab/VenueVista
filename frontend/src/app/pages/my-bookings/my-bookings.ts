import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Api, BookingResponse, User } from '../../services/api';
import { TicketQr } from '../../shared/ticket-qr/ticket-qr';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink, TicketQr],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css'
})
export class MyBookings implements OnInit {
  user: User | null = null;
  bookings: BookingResponse[] = [];
  loading = false;
  cancellingId: number | null = null;
  errorMessage = '';
  successMessage = '';
  showQrFor: number | null = null;

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
    this.loadBookings();
  }

  loadBookings(): void {
    if (!this.user) {
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    this.api.getMyBookings(this.user.id).subscribe({
      next: (response) => {
        this.bookings = Array.isArray(response) ? response : [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Bookings loading error:', error);
        this.loading = false;
        this.errorMessage = 'Unable to load your bookings. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  get activeCount(): number {
    return this.bookings.filter(b => b.status === 'CONFIRMED').length;
  }

  get totalSpent(): number {
    return this.bookings
      .filter(b => b.status === 'CONFIRMED')
      .reduce((sum, b) => sum + b.totalAmount, 0);
  }

  // Sirf future events ki confirmed booking cancel ho sakti hai
  canCancel(booking: BookingResponse): boolean {
    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING_PAYMENT') {
      return false;
    }
    return !booking.eventDate || new Date(booking.eventDate) > new Date();
  }

  cancel(booking: BookingResponse): void {
    if (!this.user) {
      return;
    }
    if (!confirm(`Cancel booking #${booking.bookingId} for "${booking.eventName}"?`)) {
      return;
    }

    this.cancellingId = booking.bookingId;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.cancelBooking(booking.bookingId, this.user.id).subscribe({
      next: (updated) => {
        this.bookings = this.bookings.map(b =>
          b.bookingId === updated.bookingId ? updated : b
        );
        this.cancellingId = null;
        this.successMessage = `Booking #${updated.bookingId} cancelled. Seats are free again.`;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Cancel error:', error);
        this.cancellingId = null;
        this.errorMessage = error?.error?.message || 'Could not cancel booking. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  logout(): void {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}