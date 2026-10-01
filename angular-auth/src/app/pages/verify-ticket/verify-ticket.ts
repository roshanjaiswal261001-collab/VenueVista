import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api, TicketVerifyResponse, User } from '../../services/api';

@Component({
  selector: 'app-verify-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './verify-ticket.html',
  styleUrl: './verify-ticket.css'
})
export class VerifyTicket implements OnInit {
  user: User | null = null;
  code = '';
  result: TicketVerifyResponse | null = null;
  loading = false;
  checkingIn = false;
  errorMessage = '';

  constructor(private api: Api, private router: Router, private cdr: ChangeDetectorRef) {}

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
    if (this.user.role !== 'ADMIN') {
      this.router.navigate(['/dashboard']);
    }
  }

  verify(): void {
    const code = this.code.trim();
    if (!code) {
      this.errorMessage = 'Enter a ticket code.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.result = null;

    this.api.verifyTicket(code).subscribe({
      next: (r) => {
        this.result = r;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.status === 404 ? 'Ticket not found.' : 'Could not verify ticket.';
        this.cdr.markForCheck();
      }
    });
  }

  checkIn(): void {
    if (!this.result) {
      return;
    }
    this.checkingIn = true;
    this.errorMessage = '';

    this.api.checkInTicket(this.result.ticketNumber).subscribe({
      next: (r) => {
        this.result = r;
        this.checkingIn = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.checkingIn = false;
        this.errorMessage = error?.error?.message || 'Check-in failed.';
        this.cdr.markForCheck();
      }
    });
  }

  reset(): void {
    this.code = '';
    this.result = null;
    this.errorMessage = '';
  }

  logout(): void {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
