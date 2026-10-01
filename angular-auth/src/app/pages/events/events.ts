import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api, User, Venue, VenueEvent } from '../../services/api';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './events.html',
  styleUrl: './events.css'
})
export class Events implements OnInit {
  user: User | null = null;
  events: VenueEvent[] = [];
  venues: Venue[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  categories = ['Concert', 'Conference', 'Wedding', 'Sports', 'Comedy', 'Workshop', 'Other'];

  newEvent = {
    name: '',
    description: '',
    category: '',
    eventDate: '',
    ticketPrice: 0,
    venueId: 0
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
    this.loadEvents();
    this.loadVenues();
  }

  loadEvents(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.getEvents().subscribe({
      next: (response) => {
        this.events = Array.isArray(response) ? response : [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Event loading error:', error);
        this.loading = false;
        this.errorMessage = 'Unable to load events. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  loadVenues(): void {
    this.api.getVenues().subscribe({
      next: (response) => {
        this.venues = Array.isArray(response) ? response : [];
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Venue loading error:', error);
      }
    });
  }

  addEvent(): void {
    const { name, description, category, eventDate, ticketPrice, venueId } = this.newEvent;

    if (!name.trim() || !category || !eventDate || ticketPrice < 0 || !venueId) {
      this.errorMessage = 'Please fill name, category, date, price and venue.';
      this.successMessage = '';
      return;
    }

    if (new Date(eventDate) <= new Date()) {
      this.errorMessage = 'Event date must be in the future.';
      this.successMessage = '';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.addEvent({
      name: name.trim(),
      description: description.trim(),
      category,
      eventDate,
      ticketPrice,
      venueId: Number(venueId)
    }).subscribe({
      next: (event) => {
        this.saving = false;
        this.successMessage = `"${event.name}" added successfully.`;
        this.newEvent = {
          name: '',
          description: '',
          category: '',
          eventDate: '',
          ticketPrice: 0,
          venueId: 0
        };
        this.loadEvents();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Add event error:', error);
        this.saving = false;
        this.errorMessage = error?.error?.message || 'Could not add event. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  deleteEvent(event: VenueEvent): void {
    if (!confirm(`Delete "${event.name}"?`)) {
      return;
    }

    this.api.deleteEvent(event.id).subscribe({
      next: () => {
        this.events = this.events.filter(e => e.id !== event.id);
        this.successMessage = `"${event.name}" deleted.`;
        this.errorMessage = '';
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Delete event error:', error);
        this.errorMessage = 'Could not delete event. It may have bookings.';
        this.successMessage = '';
        this.cdr.markForCheck();
      }
    });
  }

  // ---------- Search + filter + posters ----------
  searchText = '';
  selectedCategory = 'All';

  private readonly posters: Record<string, { emoji: string; bg: string }> = {
    Concert:    { emoji: '🎤', bg: 'linear-gradient(135deg, #6a3093, #c1467f)' },
    Comedy:     { emoji: '😂', bg: 'linear-gradient(135deg, #f7971e, #ffd200)' },
    Conference: { emoji: '🎙️', bg: 'linear-gradient(135deg, #1e3c72, #2a5298)' },
    Technology: { emoji: '💻', bg: 'linear-gradient(135deg, #0f2027, #2c5364)' },
    Wedding:    { emoji: '💍', bg: 'linear-gradient(135deg, #b76e79, #e8c4a0)' },
    Sports:     { emoji: '🏏', bg: 'linear-gradient(135deg, #11998e, #38ef7d)' },
    Workshop:   { emoji: '🛠️', bg: 'linear-gradient(135deg, #136a8a, #267871)' }
  };

  posterFor(category: string): { emoji: string; bg: string } {
    return this.posters[category] ?? { emoji: '🎉', bg: 'linear-gradient(135deg, #2b211c, #b8893f)' };
  }

  get categoryChips(): string[] {
    const set = new Set(this.events.map(e => e.category).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }

  get filteredEvents(): VenueEvent[] {
    const q = this.searchText.trim().toLowerCase();
    return this.events
      .filter(e => this.selectedCategory === 'All' || e.category === this.selectedCategory)
      .filter(e => !q || [e.name, e.description, e.category, e.venue?.name, e.venue?.location]
        .some(v => (v ?? '').toLowerCase().includes(q)))
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }

  isPast(event: VenueEvent): boolean {
    return !!event.eventDate && new Date(event.eventDate) < new Date();
  }

  get isAdmin(): boolean {
    return this.user?.role === 'ADMIN';
  }

  logout(): void {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}