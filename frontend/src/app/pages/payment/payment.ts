import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Api, BookingResponse, PaymentMethod, User } from '../../services/api';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class Payment implements OnInit, OnDestroy {
  user: User | null = null;
  booking: BookingResponse | null = null;

  loading = true;
  paying = false;
  expired = false;
  errorMessage = '';

  method: PaymentMethod = 'UPI';
  methods: { value: PaymentMethod; label: string }[] = [
    { value: 'UPI', label: 'UPI' },
    { value: 'CARD', label: 'Card' },
    { value: 'NET_BANKING', label: 'Net Banking' }
  ];

  // Sirf demo ke liye. Yeh details backend ko KABHI nahi bheji jaati.
  upiId = '';
  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  bank = '';
  banks = ['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak'];

  secondsLeft = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

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

    const bookingId = Number(this.route.snapshot.paramMap.get('bookingId'));
    if (!bookingId) {
      this.router.navigate(['/my-bookings']);
      return;
    }
    this.loadBooking(bookingId);
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  loadBooking(bookingId: number): void {
    if (!this.user) {
      return;
    }
    this.api.getBookingDetails(bookingId, this.user.id).subscribe({
      next: (booking) => {
        this.booking = booking;
        this.loading = false;
        if (booking.status === 'PENDING_PAYMENT' && booking.holdExpiresAt) {
          this.startTimer(booking.holdExpiresAt);
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Booking load error:', error);
        this.loading = false;
        this.errorMessage = error?.error?.message || 'Booking not found.';
        this.cdr.markForCheck();
      }
    });
  }

  private startTimer(expiresAt: string): void {
    const end = new Date(expiresAt).getTime();
    const tick = () => {
      this.secondsLeft = Math.max(0, Math.floor((end - Date.now()) / 1000));
      if (this.secondsLeft === 0) {
        this.expired = true;
        this.stopTimer();
      }
      this.cdr.markForCheck();
    };
    tick();
    this.timer = setInterval(tick, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  get timeLeft(): string {
    const m = Math.floor(this.secondsLeft / 60);
    const s = this.secondsLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get detailsValid(): boolean {
    switch (this.method) {
      case 'UPI':
        return /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(this.upiId.trim());
      case 'CARD':
        return /^\d{16}$/.test(this.cardNumber.replace(/\s/g, ''))
          && /^(0[1-9]|1[0-2])\/\d{2}$/.test(this.cardExpiry.trim())
          && /^\d{3}$/.test(this.cardCvv.trim());
      case 'NET_BANKING':
        return !!this.bank;
    }
  }

  pay(): void {
    if (!this.user || !this.booking || this.expired) {
      return;
    }
    if (!this.detailsValid) {
      this.errorMessage = 'Please enter valid payment details.';
      return;
    }

    this.paying = true;
    this.errorMessage = '';

    this.api.payForBooking({
      bookingId: this.booking.bookingId,
      userId: this.user.id,
      paymentMethod: this.method
    }).subscribe({
      next: (confirmed) => {
        this.paying = false;
        this.booking = confirmed;
        this.stopTimer();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Payment error:', error);
        this.paying = false;
        if (error?.status === 410) {
          this.expired = true;
          this.stopTimer();
        }
        this.errorMessage = error?.error?.message || 'Payment failed. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  logout(): void {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
