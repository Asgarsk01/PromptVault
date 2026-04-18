import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { NgClass } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { Prompt, Tag } from '../../models/prompt.model';
import { AuthService } from '../../services/auth.service';
import { PromptService } from '../../services/prompt.service';
import { AnalyticsSidebar } from '../analytics-sidebar/analytics-sidebar';

const PAGE_LIMIT = 12;

@Component({
  selector: 'app-prompt-list',
  imports: [
    NgClass,
    AnalyticsSidebar,
    RouterLink
  ],
  templateUrl: './prompt-list.component.html',
  styleUrl: './prompt-list.component.scss'
})
export class PromptListComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly promptService = inject(PromptService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('sentinelRef') sentinelRef!: ElementRef<HTMLDivElement>;
  private observer!: IntersectionObserver;

  isBookmarksView = false;
  prompts: Prompt[] = [];
  tags: Tag[] = [];
  activeTag = '';
  searchTerm = '';

  // Pagination state
  currentPage = 1;
  isLoadingPrompts = true;       // initial full-page load
  isLoadingMore = false;         // appending next page
  hasMore = true;                // false once a page returns < PAGE_LIMIT
  errorMessage = '';

  sortBy: 'newest' | 'oldest' = 'newest';
  columnCount: number = 3;

  ngOnInit(): void {
    this.isBookmarksView = this.router.url.includes('/bookmarks');
    this.loadTags();
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.searchTerm = params.get('search') ?? '';
        this.resetAndLoad(this.activeTag || undefined);
      });
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.observer) this.observer.disconnect();
  }

  /** Create the IntersectionObserver that watches the sentinel element at the bottom */
  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        const sentinel = entries[0];
        if (sentinel.isIntersecting && this.hasMore && !this.isLoadingMore && !this.isLoadingPrompts) {
          this.loadNextPage();
        }
      },
      { rootMargin: '200px' }   // trigger 200px before reaching the bottom
    );

    if (this.sentinelRef?.nativeElement) {
      this.observer.observe(this.sentinelRef.nativeElement);
    }
  }

  /** Re-observe after view updates (e.g. after tag change) */
  private reObserveSentinel(): void {
    if (this.observer && this.sentinelRef?.nativeElement) {
      this.observer.disconnect();
      this.observer.observe(this.sentinelRef.nativeElement);
    }
  }

  /** Clear prompts and fetch page 1 */
  resetAndLoad(tag?: string): void {
    this.prompts = [];
    this.currentPage = 1;
    this.hasMore = true;
    this.activeTag = tag ?? '';
    this.isLoadingPrompts = true;
    this.errorMessage = '';
    this.fetchPage();
  }

  /** Fetch the next page and append */
  private loadNextPage(): void {
    if (!this.hasMore || this.isLoadingMore) return;
    this.isLoadingMore = true;
    this.currentPage++;
    this.fetchPage();
  }

  /** Core fetch — used for both initial load and subsequent pages */
  private fetchPage(): void {
    const request$ = this.isBookmarksView
      ? this.promptService.getBookmarks(this.activeTag || undefined, this.currentPage, PAGE_LIMIT, this.searchTerm)
      : this.promptService.getPrompts(this.activeTag || undefined, this.currentPage, PAGE_LIMIT, this.searchTerm);

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          let incoming = page.results;

          if (this.sortBy === 'oldest') {
            incoming = [...incoming].reverse();
          }

          this.prompts = [...this.prompts, ...incoming];
          this.hasMore = page.has_more;

          this.isLoadingPrompts = false;
          this.isLoadingMore = false;
          this.reObserveSentinel();
        },
        error: () => {
          this.errorMessage = 'Unable to load prompts right now.';
          this.isLoadingPrompts = false;
          this.isLoadingMore = false;
        }
      });
  }

  loadTags(): void {
    this.promptService.getTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tags) => { this.tags = tags; },
        error: () => {}
      });
  }

  filterByTag(tagName?: string): void {
    this.resetAndLoad(tagName);
  }

  viewPrompt(promptId: number): void {
    void this.router.navigate(['/dashboard', promptId]);
  }

  addPrompt(): void {
    void this.router.navigate(['/dashboard/new']);
  }

  badgeClass(complexity: number): string {
    if (complexity <= 3) return 'badge-low';
    if (complexity <= 7) return 'badge-mid';
    return 'badge-high';
  }

  toggleLayout(): void {
    this.columnCount = this.columnCount >= 5 ? 3 : this.columnCount + 1;
  }

  toggleSort(): void {
    this.sortBy = this.sortBy === 'newest' ? 'oldest' : 'newest';
    this.prompts = [...this.prompts].reverse();
  }

  filterFromSidebar(tag: string | null): void {
    this.filterByTag(tag || undefined);
  }

  // --- Like & Bookmark State ---
  toggleLike(event: Event, prompt: Prompt): void {
    event.stopPropagation();

    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const request$ = prompt.liked_by_current_user
      ? this.promptService.unlikePrompt(prompt.id)
      : this.promptService.likePrompt(prompt.id);

    request$.subscribe({
      next: (updatedPrompt) => {
        this.replacePrompt(updatedPrompt);
      }
    });
  }

  toggleBookmark(event: Event, prompt: Prompt): void {
    event.stopPropagation();

    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const request$ = prompt.bookmarked_by_current_user
      ? this.promptService.unbookmarkPrompt(prompt.id)
      : this.promptService.bookmarkPrompt(prompt.id);

    request$.subscribe({
      next: (updatedPrompt) => {
        if (this.isBookmarksView && !updatedPrompt.bookmarked_by_current_user) {
          this.prompts = this.prompts.filter((item) => item.id !== updatedPrompt.id);
          return;
        }

        this.replacePrompt(updatedPrompt);
      }
    });
  }

  isLiked(promptId: number): boolean {
    return this.prompts.find((prompt) => prompt.id === promptId)?.liked_by_current_user ?? false;
  }

  isBookmarked(promptId: number): boolean {
    return this.prompts.find((prompt) => prompt.id === promptId)?.bookmarked_by_current_user ?? false;
  }

  private replacePrompt(updatedPrompt: Prompt): void {
    this.prompts = this.prompts.map((prompt) => (
      prompt.id === updatedPrompt.id ? updatedPrompt : prompt
    ));
  }
}
