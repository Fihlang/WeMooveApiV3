import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  ProfessionalBooking,
  BookingStatus,
  BookingType
} from '../../core/models/professional.model';
import { ProfessionalService } from '../../core/services/professional.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-booking-detail',
  templateUrl: './booking-detail.component.html',
  styleUrls: ['./booking-detail.component.scss']
})
export class BookingDetailComponent implements OnInit, OnDestroy {
  bookingId: number = 0;
  booking: ProfessionalBooking | null = null;
  isLoading = true;
  error: string | null = null;
  
  // Status subscription
  statusSubscription: Subscription | null = null;
  
  // Enums for the template
  BookingStatus = BookingStatus;
  BookingType = BookingType;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private professionalService: ProfessionalService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.bookingId = +params['id'];
      this.loadBookingDetails();
    });
  }

  ngOnDestroy(): void {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }

  loadBookingDetails(): void {
    this.isLoading = true;
    this.error = null;
    
    this.professionalService.getBooking(this.bookingId).subscribe({
      next: (data) => {
        this.booking = data;
        this.isLoading = false;
        this.subscribeToStatusUpdates();
      },
      error: (err) => {
        console.error('Error loading booking details:', err);
        this.error = 'Failed to load booking details. Please try again.';
        this.isLoading = false;
      }
    });
  }

  subscribeToStatusUpdates(): void {
    this.statusSubscription = new Subscription();
    
    this.professionalService.subscribeToBookingUpdates(this.bookingId, (data) => {
      if (data && data.bookingId === this.bookingId && this.booking) {
        // Update booking status
        this.booking.status = data.status;
        
        // Add any additional updates from the data
        if (data.completedTime) {
          this.booking.completedTime = new Date(data.completedTime);
        }
      }
    });
  }

  cancelBooking(): void {
    if (!this.booking) return;
    
    if (confirm('Are you sure you want to cancel this booking? Cancellations within 24 hours of the scheduled time may incur a fee.')) {
      this.professionalService.updateBookingStatus(this.booking.id, BookingStatus.CANCELLED).subscribe({
        next: (updatedBooking) => {
          this.booking = updatedBooking;
        },
        error: (err) => {
          console.error('Error cancelling booking:', err);
          this.error = 'Failed to cancel booking. Please try again.';
        }
      });
    }
  }

  leaveReview(): void {
    if (!this.booking) return;
    
    this.router.navigate(['/customer/bookings', this.booking.id, 'review']);
  }

  goBack(): void {
    this.router.navigate(['/customer/bookings']);
  }

  getStatusClass(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.PENDING:
        return 'text-warning';
      case BookingStatus.CONFIRMED:
        return 'text-primary';
      case BookingStatus.IN_PROGRESS:
        return 'text-info';
      case BookingStatus.COMPLETED:
        return 'text-success';
      case BookingStatus.CANCELLED:
        return 'text-danger';
      default:
        return 'text-secondary';
    }
  }

  getStatusLabel(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.PENDING:
        return 'Pending Confirmation';
      case BookingStatus.CONFIRMED:
        return 'Confirmed';
      case BookingStatus.IN_PROGRESS:
        return 'In Progress';
      case BookingStatus.COMPLETED:
        return 'Completed';
      case BookingStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
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

  canCancel(): boolean {
    if (!this.booking) return false;
    
    return [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(this.booking.status);
  }

  canReview(): boolean {
    if (!this.booking) return false;
    
    return this.booking.status === BookingStatus.COMPLETED;
  }

  formatAddress(address: any): string {
    if (!address) return '';
    
    let formattedAddress = address.addressLine1;
    
    if (address.addressLine2) {
      formattedAddress += ', ' + address.addressLine2;
    }
    
    formattedAddress += ', ' + address.city;
    formattedAddress += ', ' + address.province;
    formattedAddress += ' ' + address.zipCode;
    
    return formattedAddress;
  }

  getBookingTimeRemaining(): string {
    if (!this.booking || !this.booking.scheduledTime) return '';
    
    const now = new Date();
    const scheduledTime = new Date(this.booking.scheduledTime);
    
    if (now > scheduledTime) {
      if (this.booking.status === BookingStatus.COMPLETED || 
          this.booking.status === BookingStatus.CANCELLED) {
        return 'Service complete';
      }
      
      if (this.booking.status === BookingStatus.IN_PROGRESS) {
        return 'In progress';
      }
      
      return 'Scheduled time passed';
    }
    
    const timeDiff = scheduledTime.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''} remaining`;
    }
    
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
    }
    
    return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
  }
}