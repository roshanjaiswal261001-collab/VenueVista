import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api, User, Venue } from '../../services/api';

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

  get isAdmin(): boolean {
    return this.user?.role === 'ADMIN';
  }

  logout(): void {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}