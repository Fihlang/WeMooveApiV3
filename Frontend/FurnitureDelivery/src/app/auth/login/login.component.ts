import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  returnUrl: string;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) { 
    // Redirect to appropriate dashboard if already logged in
    if (this.authService.isAuthenticated) {
      this.redirectBasedOnRole();
    }
    
    // Initialize return URL from route parameters
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Initialize form
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // This is handled in the constructor
  }

  // Convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.submitted = true;

    // Stop if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login({
      email: this.f['email'].value,
      password: this.f['password'].value
    })
    .subscribe({
      next: () => {
        // Navigate based on user role
        this.redirectBasedOnRole();
      },
      error: err => {
        this.error = err.message || 'Login failed';
        this.loading = false;
      }
    });
  }

  private redirectBasedOnRole() {
    // Check user role and navigate to appropriate dashboard
    if (this.authService.isDriver) {
      this.router.navigate(['/driver/dashboard']);
    } else {
      this.router.navigate(['/customer/dashboard']);
    }
  }
}