import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthApiService } from '../../../editor/api/auth.service';

/**
 * Component responsible for handling user authentication via the login form.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthApiService);
  private readonly router = inject(Router);

  public loginForm: FormGroup;
  public loginError = signal<string | null>(null);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  /**
   * Submits the login form.
   * If valid, attempts to authenticate the user and redirects to the editor upon success.
   * Displays an error message if the authentication fails.
   */
  public login(): void {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.loginError.set(null);
          this.router.navigate(['/editor']);
        },
        error: (err) => {
            this.loginError.set(err.error?.message || 'Login failed');
        }
      });
    }
  }
}
