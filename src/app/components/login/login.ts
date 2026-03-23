import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthApiService } from '../../../editor/api/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthApiService);
  private router = inject(Router);

  loginForm: FormGroup;
  loginError = signal<string | null>(null);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  login() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: () => this.router.navigate(['/editor']),
        error: (err) => {
            this.loginError.set(err.error?.message || 'Login failed');
        }
      });
    }
  }
}
