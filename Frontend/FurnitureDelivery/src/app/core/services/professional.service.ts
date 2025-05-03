import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Professional,
  ProfessionalBooking,
  ProfessionalSkill,
  BookingStatus,
  BookingType
} from '../models/professional.model';
import { WebSocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class ProfessionalService {
  private apiUrl = environment.apiUrl;
  private statusUpdateSubscriptions: { [key: number]: ((data: any) => void)[] } = {};

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService
  ) {
    // Subscribe to WebSocket events for booking status updates
    this.wsService.connect();
    this.wsService.on('booking-status-update', (data: any) => {
      const bookingId = data.bookingId;
      if (bookingId && this.statusUpdateSubscriptions[bookingId]) {
        this.statusUpdateSubscriptions[bookingId].forEach(callback => {
          callback(data);
        });
      }
    });
  }

  // Professional Listing and Details
  getAllProfessionals(): Observable<Professional[]> {
    return this.http.get<Professional[]>(`${this.apiUrl}/professionals`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getProfessionalsBySkill(skill: ProfessionalSkill): Observable<Professional[]> {
    return this.http.get<Professional[]>(`${this.apiUrl}/professionals/skill/${skill}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getProfessional(id: number): Observable<Professional> {
    return this.http.get<Professional>(`${this.apiUrl}/professionals/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Booking Management
  createBooking(booking: Partial<ProfessionalBooking>): Observable<ProfessionalBooking> {
    return this.http.post<ProfessionalBooking>(`${this.apiUrl}/bookings`, booking)
      .pipe(
        catchError(this.handleError)
      );
  }

  getBooking(id: number): Observable<ProfessionalBooking> {
    return this.http.get<ProfessionalBooking>(`${this.apiUrl}/bookings/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getCustomerBookings(customerId: number): Observable<ProfessionalBooking[]> {
    return this.http.get<ProfessionalBooking[]>(`${this.apiUrl}/customers/${customerId}/bookings`)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateBookingStatus(bookingId: number, status: BookingStatus): Observable<ProfessionalBooking> {
    return this.http.put<ProfessionalBooking>(
      `${this.apiUrl}/bookings/${bookingId}/status`, 
      { status }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Real-time booking status updates
  subscribeToBookingUpdates(bookingId: number, callback: (data: any) => void): void {
    // Initialize array if it doesn't exist
    if (!this.statusUpdateSubscriptions[bookingId]) {
      this.statusUpdateSubscriptions[bookingId] = [];
    }
    
    // Add callback to array
    this.statusUpdateSubscriptions[bookingId].push(callback);
    
    // Subscribe to this specific booking
    this.wsService.emit('subscribe-booking', { bookingId });
  }

  unsubscribeFromBookingUpdates(bookingId: number, callback?: (data: any) => void): void {
    // If callback is provided, remove just that callback
    if (callback && this.statusUpdateSubscriptions[bookingId]) {
      const index = this.statusUpdateSubscriptions[bookingId].indexOf(callback);
      if (index !== -1) {
        this.statusUpdateSubscriptions[bookingId].splice(index, 1);
      }
    } else {
      // Otherwise, remove all callbacks for this booking
      delete this.statusUpdateSubscriptions[bookingId];
    }
    
    // If no more callbacks, unsubscribe from this booking
    if (!this.statusUpdateSubscriptions[bookingId] || 
        this.statusUpdateSubscriptions[bookingId].length === 0) {
      this.wsService.emit('unsubscribe-booking', { bookingId });
    }
  }

  // Review Management
  submitReview(
    professionalId: number, 
    bookingId: number, 
    rating: number, 
    comment: string,
    serviceType: ProfessionalSkill
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/reviews`, {
      professionalId,
      bookingId,
      rating,
      comment,
      serviceType
    }).pipe(
      catchError(this.handleError)
    );
  }

  getProfessionalReviews(professionalId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/professionals/${professionalId}/reviews`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Availability Management
  getProfessionalAvailability(professionalId: number, date: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/professionals/${professionalId}/availability?date=${date}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Error handling
  private handleError(error: any) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}