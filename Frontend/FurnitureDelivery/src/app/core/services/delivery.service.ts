import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Delivery } from '../../models/delivery.model';
import { DeliveryItem } from '../../models/delivery-item.model';
import { Driver, DriverWithDetails } from '../../models/driver.model';
import { Furniture } from '../../models/furniture.model';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private apiUrl = environment.apiUrl;
  
  constructor(private http: HttpClient) { }
  
  // Delivery operations
  
  /**
   * Get all deliveries for the currently logged-in customer
   */
  getMyDeliveries(): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(`${this.apiUrl}/deliveries/my`);
  }
  
  /**
   * Get a specific delivery by ID
   */
  getDelivery(id: number): Observable<Delivery> {
    return this.http.get<Delivery>(`${this.apiUrl}/deliveries/${id}`);
  }
  
  /**
   * Get a delivery with its items
   */
  getDeliveryWithItems(id: number): Observable<{delivery: Delivery, items: DeliveryItem[]}> {
    return this.http.get<{delivery: Delivery, items: DeliveryItem[]}>(`${this.apiUrl}/deliveries/${id}/with-items`);
  }
  
  /**
   * Create a new delivery
   */
  createDelivery(deliveryData: any): Observable<Delivery> {
    return this.http.post<Delivery>(`${this.apiUrl}/deliveries`, deliveryData);
  }
  
  /**
   * Update a delivery status
   */
  updateDeliveryStatus(id: number, status: string): Observable<Delivery> {
    return this.http.patch<Delivery>(`${this.apiUrl}/deliveries/${id}/status`, { status });
  }
  
  // Driver operations
  
  /**
   * Get available drivers near a location
   */
  getAvailableDrivers(latitude: number, longitude: number, radius: number = 10): Observable<DriverWithDetails[]> {
    return this.http.get<DriverWithDetails[]>(
      `${this.apiUrl}/drivers/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
    );
  }
  
  /**
   * Get a specific driver's details
   */
  getDriverDetails(driverId: number): Observable<Driver> {
    return this.http.get<Driver>(`${this.apiUrl}/drivers/${driverId}`);
  }
  
  // Furniture operations
  
  /**
   * Get all furniture items
   */
  getAllFurniture(): Observable<Furniture[]> {
    return this.http.get<Furniture[]>(`${this.apiUrl}/furniture`);
  }
  
  /**
   * Get furniture by category
   */
  getFurnitureByCategory(category: string): Observable<Furniture[]> {
    return this.http.get<Furniture[]>(`${this.apiUrl}/furniture/category/${category}`);
  }
  
  // Review operations
  
  /**
   * Submit a review for a completed delivery
   */
  submitReview(deliveryId: number, driverId: number, rating: number, comment?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reviews`, {
      deliveryId,
      driverId,
      rating,
      comment
    });
  }
  
  /**
   * Get driver reviews
   */
  getDriverReviews(driverId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reviews/driver/${driverId}`);
  }
  
  // Chat/Message operations
  
  /**
   * Get chat messages for a delivery
   */
  getChatMessages(deliveryId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/messages/delivery/${deliveryId}`);
  }
  
  /**
   * Send a chat message
   */
  sendChatMessage(deliveryId: number, content: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/messages`, {
      deliveryId,
      content
    });
  }
  
  // Payment operations
  
  /**
   * Process payment for a delivery
   */
  processPayment(deliveryId: number, paymentMethod: string, paymentDetails: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments`, {
      deliveryId,
      paymentMethod,
      ...paymentDetails
    });
  }
  
  /**
   * Get payment details for a delivery
   */
  getPaymentDetails(deliveryId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments/delivery/${deliveryId}`);
  }
}