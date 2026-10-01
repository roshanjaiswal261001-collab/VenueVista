import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api, User } from '../../services/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  email: string = '';
  password: string = '';

  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;

  constructor(
    private api: Api,
    private router: Router
  ) {}

  login(): void {

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter email and password.';
      return;
    }

    this.loading = true;

    const loginData = {
      email: this.email,
      password: this.password
    };

    this.api.login(loginData).subscribe({

      next: (response: User) => {

        this.loading = false;

        localStorage.setItem(
          'user',
          JSON.stringify(response)
        );

        this.successMessage = `Welcome back, ${response.name}!`;

        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 500);
      },

      error: (error) => {

        this.loading = false;

        console.error('Login Error:', error);

        if (error.status === 401) {
          this.errorMessage = 'Invalid email or password.';
        } else if (error.status === 0) {
          this.errorMessage =
            'Unable to connect to the server. Make sure the backend is running on port 8080.';
        } else {
          this.errorMessage =
            'Something went wrong. Please try again.';
        }
      }

    });
  }
}