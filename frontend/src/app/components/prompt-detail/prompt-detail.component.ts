import { DatePipe, NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Prompt } from '../../models/prompt.model';
import { PromptService } from '../../services/prompt.service';

@Component({
  selector: 'app-prompt-detail',
  standalone: true,
  imports: [
    DatePipe,
    NgClass,
  ],
  templateUrl: './prompt-detail.component.html',
  styleUrl: './prompt-detail.component.scss'
})
export class PromptDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly promptService = inject(PromptService);
  private readonly cdr = inject(ChangeDetectorRef);

  prompt: Prompt | null = null;
  isLoading = true;
  errorMessage = '';
  copied = false;

  copyToClipboard(text: string): void {
    this.copied = true;
    this.cdr.detectChanges();

    navigator.clipboard.writeText(text).then(() => {
      setTimeout(() => {
        this.copied = false;
        this.cdr.detectChanges();
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      this.copied = false;
      this.cdr.detectChanges();
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.errorMessage = 'Prompt not found';
      this.isLoading = false;
      return;
    }

    this.promptService.getPrompt(id).subscribe({
      next: (prompt) => {
        this.prompt = prompt;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.status === 404 ? 'Prompt not found' : 'Unable to load prompt details.';
        this.isLoading = false;
      }
    });
  }

  backToList(): void {
    void this.router.navigate(['/dashboard']);
  }

  badgeClass(complexity: number): string {
    if (complexity <= 3) {
      return 'badge-low';
    }

    if (complexity <= 7) {
      return 'badge-mid';
    }

    return 'badge-high';
  }

  progressWidth(complexity: number): string {
    return `${Math.max(1, Math.min(complexity, 10)) * 10}%`;
  }
}
