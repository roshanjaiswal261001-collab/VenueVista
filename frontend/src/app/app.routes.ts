import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then(
        m => m.Login
      )
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register').then(
        m => m.Register
      )
  },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then(
        m => m.Dashboard
      )
  },

  {
    path: 'venues',
    loadComponent: () =>
      import('./pages/venues/venues').then(
        m => m.Venues
      )
  },

  {
    path: 'events',
    loadComponent: () =>
      import('./pages/events/events').then(
        m => m.Events
      )
  },

  {
    path: 'book/:eventId',
    loadComponent: () =>
      import('./pages/book-event/book-event').then(
        m => m.BookEvent
      )
  },

  {
    path: 'my-bookings',
    loadComponent: () =>
      import('./pages/my-bookings/my-bookings').then(
        m => m.MyBookings
      )
  }

];