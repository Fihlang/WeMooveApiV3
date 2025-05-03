import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Professional, 
  ProfessionalWithReviews, 
  ProfessionalReview, 
  ProfessionalBooking,
  ProfessionalSkill,
  BookingStatus,
  BookingType
} from '../models/professional.model';
import { WebsocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class ProfessionalService {
  private baseUrl = `${environment.apiUrl}/api`;

  constructor(
    private http: HttpClient,
    private websocketService: WebsocketService
  ) { }

  /**
   * Get a list of professionals with optional filtering
   */
  getProfessionals(
    skill?: ProfessionalSkill,
    latitude?: number,
    longitude?: number,
    radius?: number,
    isAvailable?: boolean
  ): Observable<Professional[]> {
    let params = new HttpParams();
    
    if (skill) {
      params = params.set('skill', skill);
    }
    
    if (latitude && longitude && radius) {
      params = params.set('latitude', latitude.toString());
      params = params.set('longitude', longitude.toString());
      params = params.set('radius', radius.toString());
    }
    
    if (isAvailable !== undefined) {
      params = params.set('isAvailable', isAvailable.toString());
    }
    
    return this.http.get<Professional[]>(`${this.baseUrl}/professionals`, { params });
  }

  /**
   * Get a professional by ID with their reviews
   */
  getProfessionalWithReviews(id: number): Observable<ProfessionalWithReviews> {
    return this.http.get<ProfessionalWithReviews>(`${this.baseUrl}/professionals/${id}`);
  }

  /**
   * Get reviews for a professional
   */
  getProfessionalReviews(id: number): Observable<ProfessionalReview[]> {
    return this.http.get<ProfessionalReview[]>(`${this.baseUrl}/professionals/${id}/reviews`);
  }

  /**
   * Create a booking for a professional
   */
  createBooking(booking: Partial<ProfessionalBooking>): Observable<ProfessionalBooking> {
    return this.http.post<ProfessionalBooking>(`${this.baseUrl}/professional-bookings`, booking);
  }

  /**
   * Get bookings for a customer
   */
  getCustomerBookings(customerId: number, status?: BookingStatus): Observable<ProfessionalBooking[]> {
    let params = new HttpParams();
    
    if (status) {
      params = params.set('status', status);
    }
    
    return this.http.get<ProfessionalBooking[]>(
      `${this.baseUrl}/customers/${customerId}/professional-bookings`, 
      { params }
    );
  }

  /**
   * Get bookings for a professional
   */
  getProfessionalBookings(professionalId: number, status?: BookingStatus): Observable<ProfessionalBooking[]> {
    let params = new HttpParams();
    
    if (status) {
      params = params.set('status', status);
    }
    
    return this.http.get<ProfessionalBooking[]>(
      `${this.baseUrl}/professionals/${professionalId}/bookings`,
      { params }
    );
  }

  /**
   * Get a specific booking by ID
   */
  getBooking(id: number): Observable<ProfessionalBooking> {
    return this.http.get<ProfessionalBooking>(`${this.baseUrl}/professional-bookings/${id}`);
  }

  /**
   * Update booking status
   */
  updateBookingStatus(id: number, status: BookingStatus): Observable<ProfessionalBooking> {
    return this.http.put<ProfessionalBooking>(
      `${this.baseUrl}/professional-bookings/${id}/status`,
      { status }
    );
  }

  /**
   * Submit a review for a professional
   */
  submitReview(
    professionalId: number, 
    bookingId: number, 
    rating: number, 
    comment: string, 
    serviceType: ProfessionalSkill
  ): Observable<ProfessionalReview> {
    return this.http.post<ProfessionalReview>(
      `${this.baseUrl}/professionals/${professionalId}/reviews`,
      { bookingId, rating, comment, serviceType }
    );
  }

  /**
   * Subscribe to real-time professional status updates 
   * (when professionals come online/offline or update availability)
   */
  subscribeToStatusUpdates(callback: (data: any) => void): void {
    this.websocketService.subscribe('professional-status', callback);
  }

  /**
   * Subscribe to real-time booking updates
   */
  subscribeToBookingUpdates(bookingId: number, callback: (data: any) => void): void {
    this.websocketService.subscribe(`booking-${bookingId}`, callback);
  }

  /**
   * Get available professionals for immediate booking
   */
  getAvailableProfessionals(
    latitude: number,
    longitude: number,
    radius: number = 10,
    skill: ProfessionalSkill
  ): Observable<Professional[]> {
    return this.getProfessionals(skill, latitude, longitude, radius, true);
  }
}