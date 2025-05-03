import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  Professional, 
  ProfessionalBooking,
  BookingType,
  BookingStatus,
  ProfessionalSkill
} from '../../core/models/professional.model';
import { ProfessionalService } from '../../core/services/professional.service';
import { AuthService } from '../../core/services/auth.service';
import { Address } from '../../core/models/address.model';
import { AddressService } from '../../core/services/address.service';

@Component({
  selector: 'app-professional-booking',
  templateUrl: './professional-booking.component.html',
  styleUrls: ['./professional-booking.component.scss']
})
export class ProfessionalBookingComponent implements OnInit {
  professionalId: number = 0;
  professional: Professional | null = null;
  bookingForm: FormGroup;
  
  // State
  isLoading = true;
  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;
  
  // User data
  addresses: Address[] = [];
  
  // Enums for the template
  BookingType = BookingType;
  ProfessionalSkill = ProfessionalSkill;
  
  // Pricing calculation
  baseHourlyRate: number = 0;
  totalPrice: number = 0;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private professionalService: ProfessionalService,
    private addressService: AddressService,
    private authService: AuthService
  ) {
    // Initialize the booking form
    this.bookingForm = this.fb.group({
      bookingType: [BookingType.MOVING, Validators.required],
      scheduledTime: [null, Validators.required],
      duration: [2, [Validators.required, Validators.min(1), Validators.max(8)]],
      addressId: [null, Validators.required],
      itemsDescription: ['', [Validators.required, Validators.maxLength(500)]],
      specialInstructions: ['', Validators.maxLength(500)],
      termsAccepted: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.professionalId = +params['id'];
      this.loadProfessional();
      this.loadUserAddresses();
    });
    
    // Listen for form changes to update pricing
    this.bookingForm.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });
  }

  loadProfessional(): void {
    this.isLoading = true;
    this.error = null;
    
    this.professionalService.getProfessionalWithReviews(this.professionalId).subscribe({
      next: (data) => {
        this.professional = data;
        this.baseHourlyRate = data.hourlyRate;
        this.calculateTotalPrice();
        this.isLoading = false;
        
        // Set default booking type based on professional skills
        if (data.skills === ProfessionalSkill.ASSEMBLY) {
          this.bookingForm.patchValue({ bookingType: BookingType.ASSEMBLY });
        }
        
        // Disable booking types the professional doesn't offer
        if (data.skills === ProfessionalSkill.MOVING) {
          this.disableBookingType(BookingType.ASSEMBLY);
        } else if (data.skills === ProfessionalSkill.ASSEMBLY) {
          this.disableBookingType(BookingType.MOVING);
        }
      },
      error: (err) => {
        console.error('Error loading professional:', err);
        this.error = 'Failed to load professional details. Please try again.';
        this.isLoading = false;
      }
    });
  }

  loadUserAddresses(): void {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      this.error = 'User not authenticated';
      return;
    }
    
    this.addressService.getUserAddresses(userId).subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        
        // Set default address if available
        const defaultAddress = addresses.find(a => a.isDefault);
        if (defaultAddress) {
          this.bookingForm.patchValue({ addressId: defaultAddress.id });
        } else if (addresses.length > 0) {
          this.bookingForm.patchValue({ addressId: addresses[0].id });
        }
      },
      error: (err) => {
        console.error('Error loading addresses:', err);
      }
    });
  }

  disableBookingType(bookingType: BookingType): void {
    const bookingTypeControl = this.bookingForm.get('bookingType');
    if (bookingTypeControl?.value === bookingType) {
      // If the current value is being disabled, switch to the other type
      const newType = bookingType === BookingType.MOVING ? BookingType.ASSEMBLY : BookingType.MOVING;
      bookingTypeControl.setValue(newType);
    }
  }

  calculateTotalPrice(): void {
    if (!this.professional) return;
    
    const formValues = this.bookingForm.value;
    const duration = formValues.duration || 2;
    
    // Base calculation: hourly rate × duration
    this.totalPrice = this.professional.hourlyRate * duration;
    
    // Additional fees could be added here if needed
    // For example, weekend premium, rush service, etc.
  }

  getAddressDisplay(addressId: number): string {
    const address = this.addresses.find(a => a.id === addressId);
    if (!address) return 'Address not found';
    
    return `${address.addressLine1}, ${address.city}, ${address.zipCode}`;
  }

  getNextAvailableTime(): Date {
    // Default to 2 hours from now, rounded to the next half hour
    const now = new Date();
    const hoursToAdd = 2;
    
    now.setHours(now.getHours() + hoursToAdd);
    
    // Round to next half hour
    const minutes = now.getMinutes();
    if (minutes < 30) {
      now.setMinutes(30);
    } else {
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
    }
    
    now.setSeconds(0);
    now.setMilliseconds(0);
    
    return now;
  }

  submitBooking(): void {
    if (this.bookingForm.invalid) {
      this.error = 'Please fill in all required fields';
      this.markFormGroupTouched(this.bookingForm);
      return;
    }
    
    if (!this.professional) {
      this.error = 'Professional data not loaded';
      return;
    }
    
    this.isSubmitting = true;
    this.error = null;
    this.success = null;
    
    const formValues = this.bookingForm.value;
    const selectedAddress = this.addresses.find(a => a.id === formValues.addressId);
    
    if (!selectedAddress) {
      this.error = 'Selected address not found';
      this.isSubmitting = false;
      return;
    }
    
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      this.error = 'User not authenticated';
      this.isSubmitting = false;
      return;
    }
    
    const bookingData: Partial<ProfessionalBooking> = {
      professionalId: this.professionalId,
      customerId: userId,
      bookingType: formValues.bookingType,
      status: BookingStatus.PENDING,
      scheduledTime: new Date(formValues.scheduledTime),
      duration: formValues.duration,
      totalCost: this.totalPrice,
      address: {
        addressLine1: selectedAddress.addressLine1,
        addressLine2: selectedAddress.addressLine2,
        city: selectedAddress.city,
        province: selectedAddress.province,
        zipCode: selectedAddress.zipCode,
        country: selectedAddress.country,
        latitude: selectedAddress.latitude,
        longitude: selectedAddress.longitude
      },
      itemsDescription: formValues.itemsDescription,
      specialInstructions: formValues.specialInstructions
    };
    
    this.professionalService.createBooking(bookingData).subscribe({
      next: (booking) => {
        this.success = 'Booking successfully created! The professional will confirm your booking soon.';
        this.isSubmitting = false;
        
        // Redirect to booking confirmation page after a delay
        setTimeout(() => {
          this.router.navigate(['/customer/bookings', booking.id]);
        }, 2000);
      },
      error: (err) => {
        console.error('Error creating booking:', err);
        this.error = 'Failed to create booking. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as FormGroup).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  getBookingTypeLabel(type: BookingType): string {
    switch (type) {
      case BookingType.MOVING:
        return 'Moving Assistance';
      case BookingType.ASSEMBLY:
        return 'Furniture Assembly';
      default:
        return type;
    }
  }

  goBack(): void {
    this.router.navigate(['/customer/professionals', this.professionalId]);
  }
}