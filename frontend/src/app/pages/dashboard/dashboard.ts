
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Api, User, Venue } from '../../services/api';

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
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser) as User;
      } catch {
        localStorage.removeItem('user');
      }
    }
    this.loadVenues();
  }

  loadVenues(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.getVenues().subscribe({
      next: (response: Venue[]) => {
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

  logout(): void {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}