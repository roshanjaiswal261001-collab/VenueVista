import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../../services/api';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  name: string = '';
  email: string = '';
  password: string = '';

  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;

  constructor(
    private api: Api,
    private router: Router
  ) {}

  register(): void {

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.name || !this.email || !this.password) {
      this.errorMessage = 'Please fill all fields.';
      return;
    }

    this.loading = true;

    const registerData = {
      name: this.name,
      email: this.email,
      password: this.password
    };

    this.api.register(registerData).subscribe({

      next: () => {

        this.loading = false;

        this.successMessage = 'Registration successful!';

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },

      error: (error) => {

        this.loading = false;

        if (error.status === 400) {
          this.errorMessage = 'Email already registered.';
        } else {
          this.errorMessage = error.status === 0
            ? 'Unable to connect to the server. Make sure the backend is running on port 8080.'
            : 'Something went wrong. Please try again.';
        }
      }

    });
  }
}
