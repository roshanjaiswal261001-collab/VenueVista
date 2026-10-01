import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Api, BookingResponse, Seat, User, VenueEvent } from '../../services/api';

interface SeatRow {
  rowName: string;
  seats: Seat[];
}

@Component({
  selector: 'app-book-event',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './book-event.html',
  styleUrl: './book-event.css'
})
export class BookEvent implements OnInit {
  readonly MAX_SEATS = 10;

  user: User | null = null;
  event: VenueEvent | null = null;
  rows: SeatRow[] = [];
  bookedSeatIds = new Set<number>();
  selectedSeatIds = new Set<number>();

  loading = true;
  booking = false;
  errorMessage = '';
  confirmedBooking: BookingResponse | null = null;

  constructor(
    private api: Api,
    private route: ActivatedRoute,
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

    const eventId = Number(this.route.snapshot.paramMap.get('eventId'));
    if (!eventId) {
      this.router.navigate(['/events']);
      return;
    }
    this.loadEvent(eventId);
  }

  // Event load karo, phir uske venue ki seats aur booked seats ek saath
  loadEvent(eventId: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.getEventById(eventId).subscribe({
      next: (event) => {
        this.event = event;

        if (!event || !event.venue) {
          this.loading = false;
          this.errorMessage = 'This event has no venue, so it cannot be booked.';
          this.cdr.markForCheck();
          return;
        }

        forkJoin({
          seats: this.api.getSeatsByVenue(event.venue.id),
          booked: this.api.getBookedSeatIds(event.id)
        }).subscribe({
          next: ({ seats, booked }) => {
            this.rows = this.groupByRow(seats);
            this.bookedSeatIds = new Set(booked);
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Seat loading error:', error);
            this.loading = false;
            this.errorMessage = 'Could not load seats. Please try again.';
            this.cdr.markForCheck();
          }
        });
      },
      error: (error) => {
        console.error('Event loading error:', error);
        this.loading = false;
        this.errorMessage = 'Event not found.';
        this.cdr.markForCheck();
      }
    });
  }

  // Seats ko rows mein baanto (A, B, C...) aur number ke hisaab se sort karo
  private groupByRow(seats: Seat[]): SeatRow[] {
    const map = new Map<string, Seat[]>();
    for (const seat of seats) {
      const row = seat.rowName || '-';
      if (!map.has(row)) {
        map.set(row, []);
      }
      map.get(row)!.push(seat);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([rowName, rowSeats]) => ({
        rowName,
        seats: rowSeats.sort((x, y) => Number(x.seatNumber) - Number(y.seatNumber))
      }));
  }

  isBooked(seat: Seat): boolean {
    return this.bookedSeatIds.has(seat.id);
  }

  isSelected(seat: Seat): boolean {
    return this.selectedSeatIds.has(seat.id);
  }

  toggleSeat(seat: Seat): void {
    if (this.isBooked(seat) || this.booking) {
      return;
    }
    this.errorMessage = '';

    if (this.selectedSeatIds.has(seat.id)) {
      this.selectedSeatIds.delete(seat.id);
    } else {
      if (this.selectedSeatIds.size >= this.MAX_SEATS) {
        this.errorMessage = `You can select up to ${this.MAX_SEATS} seats at a time.`;
        return;
      }
      this.selectedSeatIds.add(seat.id);
    }
  }

  get selectedSeatLabels(): string {
    const labels: string[] = [];
    for (const row of this.rows) {
      for (const seat of row.seats) {
        if (this.selectedSeatIds.has(seat.id)) {
          labels.push(row.rowName + seat.seatNumber);
        }
      }
    }
    return labels.join(', ');
  }

  // Sirf dikhane ke liye. Asli price backend calculate karta hai.
  get estimatedTotal(): number {
    return (this.event?.ticketPrice ?? 0) * this.selectedSeatIds.size;
  }

  confirmBooking(): void {
    if (!this.user || !this.event || this.selectedSeatIds.size === 0) {
      return;
    }

    this.booking = true;
    this.errorMessage = '';

    this.api.bookSeats({
      userId: this.user.id,
      eventId: this.event.id,
      seatIds: Array.from(this.selectedSeatIds)
    }).subscribe({
      next: (response) => {
        this.booking = false;
        this.router.navigate(['/payment', response.bookingId]);
      },
      error: (error) => {
        console.error('Booking error:', error);
        this.booking = false;
        this.errorMessage = this.readError(error);

        // Seat kisi aur ne le li? Toh latest booked seats dobara lao
        if (error?.status === 409 && this.event) {
          this.selectedSeatIds.clear();
          this.api.getBookedSeatIds(this.event.id).subscribe(ids => {
            this.bookedSeatIds = new Set(ids);
            this.cdr.markForCheck();
          });
        }
        this.cdr.markForCheck();
      }
    });
  }

  private readError(error: any): string {
    const serverMessage = error?.error?.message;
    if (serverMessage) {
      return serverMessage;
    }
    switch (error?.status) {
      case 409: return 'Some seats were just booked by someone else. Please choose again.';
      case 404: return 'Event or user not found.';
      case 400: return 'Invalid booking request.';
      default:  return 'Booking failed. Please try again.';
    }
  }

  logout(): void {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}