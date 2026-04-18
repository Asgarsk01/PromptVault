import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { TopNav } from './components/top-nav/top-nav';

import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopNav],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoginPage(): boolean {
    return this.router.url.includes('/login');
  }

  logout(): void {
    this.authService.logout();
  }
}
