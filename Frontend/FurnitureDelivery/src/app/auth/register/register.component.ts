import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  userTypes = [
    { value: 'customer', label: 'Customer' },
    { value: 'driver', label: 'Driver' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    // Redirect to home if already logged in
    if (this.authService.isAuthenticated) {
      this.redirectBasedOnRole();
    }
    
    // Initialize form
    this.registerForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      address: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      userType: ['customer', Validators.required],
      
      // Driver-specific fields, conditionally validated
      vehicleType: [''],
      licensePlate: [''],
      capacity: ['']
    }, {
      validator: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // This is handled in the constructor
    
    // Subscribe to userType changes to handle driver-specific field validation
    this.registerForm.get('userType')?.valueChanges.subscribe(userType => {
      this.updateDriverFieldValidators(userType);
    });
  }

  // Convenience getter for easy access to form fields
  get f() { return this.registerForm.controls; }

  onSubmit() {
    this.submitted = true;

    // Stop if form is invalid
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    // Prepare data for registration
    const registrationData: any = {
      firstName: this.f['firstName'].value,
      lastName: this.f['lastName'].value,
      email: this.f['email'].value,
      phoneNumber: this.f['phoneNumber'].value,
      address: this.f['address'].value,
      password: this.f['password'].value,
      userType: this.f['userType'].value
    };

    // Add driver-specific fields if user is a driver
    if (this.f['userType'].value === 'driver') {
      registrationData.driver = {
        vehicleType: this.f['vehicleType'].value,
        licensePlate: this.f['licensePlate'].value,
        capacity: this.f['capacity'].value
      };
    }

    this.authService.register(registrationData)
      .subscribe({
        next: () => {
          // After successful registration, navigate to login
          this.router.navigate(['/auth/login'], {
            queryParams: { registered: 'true' }
          });
        },
        error: err => {
          this.error = err.message || 'Registration failed';
          this.loading = false;
        }
      });
  }

  // Custom validator for password matching
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      return null;
    }
  }

  // Update validation for driver-specific fields based on user type
  private updateDriverFieldValidators(userType: string) {
    const vehicleTypeControl = this.registerForm.get('vehicleType');
    const licensePlateControl = this.registerForm.get('licensePlate');
    const capacityControl = this.registerForm.get('capacity');

    if (userType === 'driver') {
      // Add validators for driver fields
      vehicleTypeControl?.setValidators([Validators.required]);
      licensePlateControl?.setValidators([Validators.required]);
      capacityControl?.setValidators([Validators.required]);
    } else {
      // Clear validators for driver fields
      vehicleTypeControl?.clearValidators();
      licensePlateControl?.clearValidators();
      capacityControl?.clearValidators();
    }

    // Update validation state
    vehicleTypeControl?.updateValueAndValidity();
    licensePlateControl?.updateValueAndValidity();
    capacityControl?.updateValueAndValidity();
  }

  // Helper method to redirect based on user role
  private redirectBasedOnRole() {
    if (this.authService.isDriver) {
      this.router.navigate(['/driver/dashboard']);
    } else {
      this.router.navigate(['/customer/dashboard']);
    }
  }
}