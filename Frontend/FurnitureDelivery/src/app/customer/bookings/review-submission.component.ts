import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  ProfessionalBooking, 
  ProfessionalSkill,
  BookingStatus
} from '../../core/models/professional.model';
import { ProfessionalService } from '../../core/services/professional.service';

@Component({
  selector: 'app-review-submission',
  templateUrl: './review-submission.component.html',
  styleUrls: ['./review-submission.component.scss']
})
export class ReviewSubmissionComponent implements OnInit {
  bookingId: number = 0;
  booking: ProfessionalBooking | null = null;
  reviewForm: FormGroup;
  
  // State
  isLoading = true;
  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;
  
  // Rating
  selectedRating: number = 5;
  hoverRating: number = 0;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private professionalService: ProfessionalService
  ) {
    // Initialize review form
    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.bookingId = +params['id'];
      this.loadBookingDetails();
    });
  }

  loadBookingDetails(): void {
    this.isLoading = true;
    this.error = null;
    
    this.professionalService.getBooking(this.bookingId).subscribe({
      next: (data) => {
        this.booking = data;
        this.isLoading = false;
        
        // Verify booking is completed
        if (this.booking.status !== BookingStatus.COMPLETED) {
          this.error = 'This booking is not completed yet. You can only review completed bookings.';
        }
      },
      error: (err) => {
        console.error('Error loading booking details:', err);
        this.error = 'Failed to load booking details. Please try again.';
        this.isLoading = false;
      }
    });
  }

  submitReview(): void {
    if (this.reviewForm.invalid) {
      this.markFormGroupTouched(this.reviewForm);
      return;
    }
    
    if (!this.booking || !this.booking.professional) {
      this.error = 'Booking or professional data is missing';
      return;
    }
    
    this.isSubmitting = true;
    this.error = null;
    this.success = null;
    
    const formValues = this.reviewForm.value;
    const professionalId = this.booking.professionalId;
    const serviceType = this.getServiceType();
    
    this.professionalService.submitReview(
      professionalId,
      this.bookingId,
      formValues.rating,
      formValues.comment,
      serviceType
    ).subscribe({
      next: () => {
        this.success = 'Review submitted successfully! Thank you for your feedback.';
        this.isSubmitting = false;
        
        // Redirect to booking details page after a delay
        setTimeout(() => {
          this.router.navigate(['/customer/bookings', this.bookingId]);
        }, 2000);
      },
      error: (err) => {
        console.error('Error submitting review:', err);
        this.error = 'Failed to submit review. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  setRating(rating: number): void {
    this.selectedRating = rating;
    this.reviewForm.patchValue({ rating });
  }

  setHoverRating(rating: number): void {
    this.hoverRating = rating;
  }

  clearHoverRating(): void {
    this.hoverRating = 0;
  }

  getEffectiveRating(starPosition: number): string {
    const rating = this.hoverRating > 0 ? this.hoverRating : this.selectedRating;
    return starPosition <= rating ? 'star-fill' : 'star';
  }

  getStarColor(starPosition: number): string {
    const rating = this.hoverRating > 0 ? this.hoverRating : this.selectedRating;
    return starPosition <= rating ? 'text-warning' : 'text-muted';
  }

  getRatingLabel(): string {
    switch (this.selectedRating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  }

  getServiceType(): ProfessionalSkill {
    if (!this.booking) return ProfessionalSkill.BOTH;
    
    switch (this.booking.bookingType) {
      case 'moving':
        return ProfessionalSkill.MOVING;
      case 'assembly':
        return ProfessionalSkill.ASSEMBLY;
      default:
        return ProfessionalSkill.BOTH;
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as FormGroup).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/customer/bookings', this.bookingId]);
  }
}