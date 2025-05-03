import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { 
  ProfessionalBooking, 
  BookingStatus, 
  BookingType 
} from '../../core/models/professional.model';
import { ProfessionalService } from '../../core/services/professional.service';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-bookings-list',
  templateUrl: './bookings-list.component.html',
  styleUrls: ['./bookings-list.component.scss']
})
export class BookingsListComponent implements OnInit, OnDestroy {
  bookings: ProfessionalBooking[] = [];
  filteredBookings: ProfessionalBooking[] = [];
  isLoading = true;
  error: string | null = null;
  
  // Status filter
  statusFilter: BookingStatus | 'all' = 'all';
  
  // Enums for the template
  BookingStatus = BookingStatus;
  BookingType = BookingType;
  
  // WebSocket subscriptions
  bookingSubscriptions: Subscription[] = [];
  
  constructor(
    private professionalService: ProfessionalService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadBookings();
  }

  ngOnDestroy(): void {
    // Unsubscribe from all booking updates
    this.bookingSubscriptions.forEach(sub => sub.unsubscribe());
  }

  loadBookings(): void {
    this.isLoading = true;
    this.error = null;
    
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      this.error = 'User not authenticated';
      this.isLoading = false;
      return;
    }
    
    this.professionalService.getCustomerBookings(userId).subscribe({
      next: (data) => {
        this.bookings = data;
        this.applyFilters();
        this.isLoading = false;
        
        // Subscribe to real-time updates for each booking
        this.subscribeToBookingUpdates();
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        this.error = 'Failed to load bookings. Please try again.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    if (this.statusFilter === 'all') {
      this.filteredBookings = [...this.bookings];
    } else {
      this.filteredBookings = this.bookings.filter(b => b.status === this.statusFilter);
    }
    
    // Sort bookings: active ones first, then by scheduled time (most recent first)
    this.filteredBookings.sort((a, b) => {
      // Active bookings first (pending, confirmed, in_progress)
      const activeStatuses = [
        BookingStatus.PENDING, 
        BookingStatus.CONFIRMED, 
        BookingStatus.IN_PROGRESS
      ];
      
      const aIsActive = activeStatuses.includes(a.status);
      const bIsActive = activeStatuses.includes(b.status);
      
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      
      // Then sort by scheduled time (most recent first)
      return new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime();
    });
  }

  changeStatusFilter(status: BookingStatus | 'all'): void {
    this.statusFilter = status;
    this.applyFilters();
  }

  viewBookingDetails(booking: ProfessionalBooking): void {
    this.router.navigate(['/customer/bookings', booking.id]);
  }

  cancelBooking(booking: ProfessionalBooking): void {
    if (confirm('Are you sure you want to cancel this booking? Cancellations within 24 hours of the scheduled time may incur a fee.')) {
      this.professionalService.updateBookingStatus(booking.id, BookingStatus.CANCELLED).subscribe({
        next: (updatedBooking) => {
          // Find and update the booking in the list
          const index = this.bookings.findIndex(b => b.id === updatedBooking.id);
          if (index !== -1) {
            this.bookings[index] = updatedBooking;
            this.applyFilters();
          }
        },
        error: (err) => {
          console.error('Error cancelling booking:', err);
          this.error = 'Failed to cancel booking. Please try again.';
        }
      });
    }
  }

  subscribeToBookingUpdates(): void {
    // Clear existing subscriptions
    this.bookingSubscriptions.forEach(sub => sub.unsubscribe());
    this.bookingSubscriptions = [];
    
    // Subscribe to each booking
    this.bookings.forEach(booking => {
      this.professionalService.subscribeToBookingUpdates(booking.id, (data) => {
        if (data && data.bookingId === booking.id) {
          // Update booking status
          const index = this.bookings.findIndex(b => b.id === data.bookingId);
          if (index !== -1) {
            this.bookings[index].status = data.status;
            
            // Add any additional updates from the data
            if (data.completedTime) {
              this.bookings[index].completedTime = new Date(data.completedTime);
            }
            
            this.applyFilters();
          }
        }
      });
    });
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

  canCancel(booking: ProfessionalBooking): boolean {
    return [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status);
  }

  canReview(booking: ProfessionalBooking): boolean {
    return booking.status === BookingStatus.COMPLETED;
  }

  reviewBooking(booking: ProfessionalBooking): void {
    this.router.navigate(['/customer/bookings', booking.id, 'review']);
  }

  countBookingsByStatus(status: BookingStatus): number {
    return this.bookings.filter(b => b.status === status).length;
  }
}