import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Tag } from '../../models/prompt.model';
import { PromptService } from '../../services/prompt.service';

type ApiErrorResponse = {
  errors?: Record<string, string>;
  error?: string;
};

@Component({
  selector: 'app-prompt-form',
  standalone: true,
  imports: [
    NgClass,
    ReactiveFormsModule,
  ],
  templateUrl: './prompt-form.component.html',
  styleUrl: './prompt-form.component.scss'
})
export class PromptFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly promptService = inject(PromptService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  tags: Tag[] = [];
  isLoadingTags = true;
  isSubmitting = false;
  apiErrors: Record<string, string> = {};
  formError = '';
  currentStep: 1 | 2 = 1;
  showSuccessModal = false;

  readonly promptForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    content: ['', [Validators.required, Validators.minLength(20)]],
    complexity: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
    tags: [[] as string[]]
  });

  ngOnInit(): void {
    const trendingTags = ['Midjourney', 'UI/UX', 'Editorial', '3D-Render', 'Cyberpunk', 'Hyper-Real', 'Minimalism'];
    
    this.promptService.getTags().subscribe({
      next: (tags) => {
        // Create full tag list, ensuring trending ones are included
        const existingNames = new Set(tags.map(t => t.name.toLowerCase()));
        const merged = [...tags];
        
        trendingTags.forEach(name => {
          if (!existingNames.has(name.toLowerCase())) {
            merged.push({ id: 0, name }); // ID 0 for new/unsaved tags
          }
        });

        this.tags = merged.sort((a, b) => a.name.localeCompare(b.name));
        this.isLoadingTags = false;
      },
      error: () => {
        // Fallback to just trending tags on error
        this.tags = trendingTags.map(name => ({ id: 0, name }));
        this.formError = 'Unable to load all tags, showing defaults.';
        this.isLoadingTags = false;
      }
    });
  }

  submit(): void {
    this.apiErrors = {};
    this.formError = '';

    if (this.promptForm.invalid) {
      this.promptForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.promptService.createPrompt(this.promptForm.getRawValue()).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showSuccessModal = true;
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;

        const payload = error.error as ApiErrorResponse;
        this.apiErrors = payload?.errors ?? {};
        this.formError = payload?.error ?? (Object.keys(this.apiErrors).length ? '' : 'Unable to save prompt.');
      }
    });
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      const titleControl = this.promptForm.controls.title;
      const contentControl = this.promptForm.controls.content;
      
      titleControl.markAsTouched();
      contentControl.markAsTouched();

      if (titleControl.valid && contentControl.valid) {
        this.currentStep = 2;
      }
    }
  }

  prevStep(): void {
    if (this.currentStep === 2) {
      this.currentStep = 1;
    }
  }

  backToList(): void {
    void this.router.navigate(['/dashboard']);
  }

  fieldError(fieldName: 'title' | 'content' | 'complexity'): string {
    const control = this.promptForm.controls[fieldName];

    if (!control.touched && !control.dirty) {
      return '';
    }

    if (this.apiErrors[fieldName]) {
      return this.apiErrors[fieldName];
    }

    if (control.hasError('required')) {
      return `${this.label(fieldName)} is required.`;
    }

    if (control.hasError('minlength')) {
      return `${this.label(fieldName)} is too short.`;
    }

    if (control.hasError('min')) {
      return 'Complexity must be at least 1.';
    }

    if (control.hasError('max')) {
      return 'Complexity cannot be greater than 10.';
    }

    return '';
  }

  toggleTag(tagName: string): void {
    const selectedTags = [...this.promptForm.controls.tags.getRawValue()];
    const index = selectedTags.indexOf(tagName);

    if (index >= 0) {
      selectedTags.splice(index, 1);
      this.formError = '';
    } else {
      if (selectedTags.length >= 4) {
        this.formError = 'Choose up to 4 tags for a prompt.';
        return;
      }

      selectedTags.push(tagName);
      this.formError = '';
    }

    this.promptForm.controls.tags.setValue(selectedTags);
    this.promptForm.controls.tags.markAsDirty();
  }

  isTagSelected(tagName: string): boolean {
    return this.promptForm.controls.tags.getRawValue().includes(tagName);
  }

  selectedTagCount(): number {
    return this.promptForm.controls.tags.getRawValue().length;
  }

  titleLength(): number {
    return this.promptForm.controls.title.value.length;
  }

  contentLength(): number {
    return this.promptForm.controls.content.value.length;
  }

  complexityValue(): number {
    return Number(this.promptForm.controls.complexity.value) || 1;
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

  private label(fieldName: 'title' | 'content' | 'complexity'): string {
    if (fieldName === 'title') {
      return 'Title';
    }

    if (fieldName === 'content') {
      return 'Content';
    }

    return 'Complexity';
  }
}
