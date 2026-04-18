import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';

import { PromptService } from '../../services/prompt.service';

@Component({
  selector: 'app-analytics-sidebar',
  standalone: true,
  imports: [NgClass, DecimalPipe],
  templateUrl: './analytics-sidebar.html',
  styleUrl: './analytics-sidebar.scss',
})
export class AnalyticsSidebar implements OnInit, OnChanges {
  private readonly promptService = inject(PromptService);

  @Input() activeTag: string | null = null;
  @Input() searchTerm = '';
  @Output() tagChanged = new EventEmitter<string | null>();

  tags: string[] = ['All'];
  selectedTag: string | null = null;

  trending = 0;
  mostViewed = 0;
  mostLiked = 0;
  savedCount = 0;
  savedProgress = 0;

  ngOnInit(): void {
    this.loadSidebarData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeTag'] && !changes['activeTag'].firstChange) {
      this.selectedTag = this.activeTag || null;
      this.loadAnalytics();
    }

    if (changes['searchTerm'] && !changes['searchTerm'].firstChange) {
      this.loadAnalytics();
    }
  }

  toggleTag(tag: string): void {
    this.selectedTag = tag === 'All' || this.selectedTag === tag ? null : tag;
    this.tagChanged.emit(this.selectedTag);
    this.loadAnalytics();
  }

  isSelected(tag: string): boolean {
    if (tag === 'All') {
      return !this.selectedTag;
    }

    return this.selectedTag === tag;
  }

  private loadSidebarData(): void {
    this.promptService.getTags().subscribe({
      next: (tags) => {
        this.tags = ['All', ...tags.map((tag) => tag.name)];
      },
      error: () => {
        this.tags = ['All'];
      }
    });

    this.loadAnalytics();
  }

  private loadAnalytics(): void {
    this.promptService.getAnalytics(this.selectedTag || undefined, this.searchTerm).subscribe({
      next: (overview) => {
        this.trending = overview.trending_percent;
        this.mostViewed = overview.most_viewed_percent;
        this.mostLiked = overview.most_liked_percent;
        this.savedCount = overview.saved_count;
        this.savedProgress = overview.saved_progress;

        if (overview.available_tags.length) {
          this.tags = ['All', ...overview.available_tags];
        }
      },
      error: () => {
        this.trending = 0;
        this.mostViewed = 0;
        this.mostLiked = 0;
        this.savedCount = 0;
        this.savedProgress = 0;
      }
    });
  }
}
