import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, filter, map, takeUntil } from 'rxjs';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './top-nav.html',
  styleUrl: './top-nav.scss',
})
export class TopNav implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();

  searchTerm = '';

  constructor() {
    this.syncSearchTermFromUrl();

    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.syncSearchTermFromUrl();
    });

    this.searchInput$.pipe(
      map((value) => value.trim()),
      debounceTime(350),
      distinctUntilChanged(),
      filter((value) => value.length === 0 || value.length >= 2),
      takeUntil(this.destroy$)
    ).subscribe((value) => {
      this.navigateWithSearch(value);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get displayName(): string {
    return this.authService.getDisplayName();
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.searchInput$.next(value);
  }

  logout(): void {
    this.authService.logout();
  }

  private navigateWithSearch(term: string): void {
    const urlTree = this.router.parseUrl(this.router.url);
    const currentSearch = String(urlTree.queryParams['search'] ?? '').trim();

    if (currentSearch === term) {
      return;
    }

    const targetRoute = urlTree.root.children['primary']?.segments[0]?.path === 'bookmarks'
      ? '/bookmarks'
      : '/dashboard';

    void this.router.navigate([targetRoute], {
      queryParams: { search: term || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private syncSearchTermFromUrl(): void {
    const urlTree = this.router.parseUrl(this.router.url);
    this.searchTerm = String(urlTree.queryParams['search'] ?? '');
  }
}
