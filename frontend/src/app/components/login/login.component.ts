import { Component, inject, OnInit } from '@angular/core';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  animations: [
    trigger('formFlip', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class LoginComponent implements OnInit {
  gridImages = [
    { url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=400&h=400&q=80', alt: 'Square 1' },
    { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=300&q=80', alt: 'Short 1' },
    { url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&w=400&h=600&q=80', alt: 'Vertical 1' },
    { url: 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?auto=format&fit=crop&w=400&h=400&q=80', alt: 'Square 2' },
    { url: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=400&h=350&q=80', alt: 'Short 2' },
    { url: 'https://images.unsplash.com/photo-1620121692029-d088224efc74?auto=format&fit=crop&w=400&h=400&q=80', alt: 'Square 3' },
    { url: 'https://images.unsplash.com/photo-1604076913837-52ab5629fba9?auto=format&fit=crop&w=400&h=550&q=80', alt: 'Vertical 2' },
    { url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&h=400&q=80', alt: 'Square 4' },
    { url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&h=300&q=80', alt: 'Short 3' },
    { url: 'https://images.unsplash.com/photo-1614850523535-0599141b7194?auto=format&fit=crop&w=400&h=600&q=80', alt: 'Vertical 3' },
    { url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=400&h=400&q=80', alt: 'Square 5' },
    { url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&h=350&q=80', alt: 'Short 4' },
    { url: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&w=400&h=400&q=80', alt: 'Square 6' },
    { url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&h=700&q=80', alt: 'Very Tall' },
    { url: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=400&h=400&q=80', alt: 'Square 7' },
    { url: 'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=400&h=300&q=80', alt: 'Short 5' },
    { url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=400&h=600&q=80', alt: 'Vertical 4' },
    { url: 'https://images.unsplash.com/photo-1579547621113-e4bb2a19bdd6?auto=format&fit=crop&w=400&h=400&q=80', alt: 'Square 8' },
    { url: 'https://images.unsplash.com/photo-1550684847-75bdda21ce95?auto=format&fit=crop&w=400&h=350&q=80', alt: 'Short 6' },
    { url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=400&h=400&q=80', alt: 'Square 9' },
    { url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=400&h=500&q=80', alt: 'Vertical 5' },
    { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=300&q=80', alt: 'Short 7' },
    { url: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&w=400&h=400&q=80', alt: 'Square 10' },
    { url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&h=400&q=80', alt: 'Square 11' },
    { url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&w=400&h=300&q=80', alt: 'Short 8' },
    { url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=400&h=650&q=80', alt: 'Vertical 6' },
    { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=400&q=80', alt: 'Square 12' },
    { url: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&w=400&h=300&q=80', alt: 'Short 9' },
    { url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&h=400&q=80', alt: 'Square 13' },
    { url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&w=400&h=500&q=80', alt: 'Vertical 7' }
  ];

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  authMode: 'login' | 'signup' | 'forgot' = 'login';
  resetRequestSent = false;
  isSubmitting = false;
  errorMessage = '';
  hidePassword = true;

  readonly loginForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    fullName: [''],
    email: ['', [Validators.email]]
  });

  get isLoginMode() { return this.authMode === 'login'; }
  get isSignupMode() { return this.authMode === 'signup'; }
  get isForgotMode() { return this.authMode === 'forgot'; }

  toggleMode(target: 'login' | 'signup' | 'forgot'): void {
    this.authMode = target;
    this.errorMessage = '';
    this.resetRequestSent = false;
    
    // Adjust validators based on mode
    this.loginForm.controls.fullName.clearValidators();
    this.loginForm.controls.email.clearValidators();
    this.loginForm.controls.username.setValidators([Validators.required]);
    this.loginForm.controls.password.setValidators([Validators.required]);

    if (this.authMode === 'signup') {
      this.loginForm.controls.fullName.setValidators([Validators.required]);
      this.loginForm.controls.email.setValidators([Validators.required, Validators.email]);
    } else if (this.authMode === 'forgot') {
      this.loginForm.controls.email.setValidators([Validators.required, Validators.email]);
      this.loginForm.controls.username.clearValidators();
      this.loginForm.controls.password.clearValidators();
    }
    
    this.loginForm.controls.fullName.updateValueAndValidity();
    this.loginForm.controls.email.updateValueAndValidity();
    this.loginForm.controls.username.updateValueAndValidity();
    this.loginForm.controls.password.updateValueAndValidity();
  }

  requestReset(): void {
    if (this.loginForm.controls.email.invalid) {
      this.loginForm.controls.email.markAsTouched();
      return;
    }
    this.isSubmitting = true;
    
    // Simulate API call
    setTimeout(() => {
      this.isSubmitting = false;
      this.resetRequestSent = true;
    }, 800);
  }


  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      void this.router.navigate(['/dashboard']);
    }
  }

  submit(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { username, password, fullName, email } = this.loginForm.getRawValue();
    this.isSubmitting = true;

    const request$ = this.isSignupMode
      ? this.authService.signup({
          full_name: fullName,
          email,
          username,
          password
        })
      : this.authService.login(username, password);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
        void this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        this.isSubmitting = false;
        const signupError = error?.error?.errors
          ? String(Object.values(error.error.errors as Record<string, string>)[0] ?? 'Unable to create account')
          : 'Unable to create account';

        this.errorMessage = this.isSignupMode
          ? signupError
          : 'Invalid credentials';
      }
    });
  }

  fieldError(fieldName: 'username' | 'password' | 'fullName' | 'email'): boolean {
    const control = this.loginForm.controls[fieldName];
    return (control.touched || control.dirty) && (control.invalid);
  }

  getPlaceholder(fieldName: 'username' | 'password' | 'fullName' | 'email', defaultText: string): string {
    if (this.fieldError(fieldName)) {
      const control = this.loginForm.controls[fieldName];
      if (control.hasError('required')) return `${defaultText} is required`;
      if (control.hasError('email')) return 'Invalid email format';
    }
    return defaultText;
  }
}
