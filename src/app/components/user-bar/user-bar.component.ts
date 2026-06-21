import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../api/services/auth.service';
import { UserService } from '../../api/services/user.service';
import { UserResponse } from '../../api/models/omega-api.models';
import { Icon } from '../icon/icon';
import { ThemeSelector } from "@editor/components/theme-selector/theme-selector";

@Component({
  selector: 'app-user-bar',
  templateUrl: './user-bar.component.html',
  styleUrls: ['./user-bar.component.scss'],
  standalone: true,
  imports: [CommonModule, Icon, ThemeSelector]
})
export class UserBarComponent implements OnInit {
  public user: UserResponse | undefined;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.userService.getMe().subscribe({
        next: (user) => {
          this.user = user;
        },
        error: () => {
          // Handle cases where the token is invalid
          this.authService.logout();
        }
      });
    }
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  onLogout(): void {
    this.authService.logout().subscribe(() => {
      this.user = undefined;
      // Using routerLink in the template is better for navigation,
      // but keeping programmatic navigation in case of side-effects after logout.
      this.router.navigate(['/login']);
    });
  }
}