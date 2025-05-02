import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { WebSocketService } from './websocket.service';
import { Observable, tap } from 'rxjs';
import { Driver, DriverWithDetails, DriverLocation } from '../models/driver.model';
import { Review } from '../models/review.model';

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  constructor(
    private httpService: HttpService,
    private wsService: WebSocketService
  ) {}

  /**
   * Get a driver by ID
   * @param driverId Driver ID
   */
  getDriver(driverId: number): Observable<Driver> {
    return this.httpService.get<Driver>(`drivers/${driverId}`);
  }

  /**
   * Get a driver by user ID
   * @param userId User ID
   */
  getDriverByUserId(userId: number): Observable<Driver> {
    return this.httpService.get<Driver>(`drivers/user/${userId}`);
  }

  /**
   * Get nearby drivers
   * @param latitude Current latitude
   * @param longitude Current longitude
   * @param radius Search radius in kilometers
   */
  getNearbyDrivers(latitude: number, longitude: number, radius: number = 10): Observable<DriverWithDetails[]> {
    return this.httpService.get<DriverWithDetails[]>(
      'drivers/nearby',
      { latitude, longitude, radius }
    );
  }

  /**
   * Create a new driver
   * @param driver Driver data
   */
  createDriver(driver: Partial<Driver>): Observable<Driver> {
    return this.httpService.post<Driver>('drivers', driver);
  }

  /**
   * Update a driver
   * @param driverId Driver ID
   * @param driverData Updated driver data
   */
  updateDriver(driverId: number, driverData: Partial<Driver>): Observable<Driver> {
    return this.httpService.put<Driver>(`drivers/${driverId}`, driverData);
  }

  /**
   * Update a driver's location
   * @param driverId Driver ID
   * @param latitude Current latitude
   * @param longitude Current longitude
   */
  updateDriverLocation(driverId: number, latitude: number, longitude: number): Observable<Driver> {
    return this.httpService.put<Driver>(`drivers/${driverId}/location`, { latitude, longitude }).pipe(
      tap(() => {
        // Send WebSocket update
        this.wsService.sendDriverLocationUpdate(driverId, latitude, longitude);
      })
    );
  }

  /**
   * Get driver reviews
   * @param driverId Driver ID
   */
  getDriverReviews(driverId: number): Observable<Review[]> {
    return this.httpService.get<Review[]>(`drivers/${driverId}/reviews`);
  }

  /**
   * Get driver rating
   * @param driverId Driver ID
   */
  getDriverRating(driverId: number): Observable<{ rating: number }> {
    return this.httpService.get<{ rating: number }>(`drivers/${driverId}/rating`);
  }

  /**
   * Subscribe to driver location updates
   */
  getDriverLocationUpdates(): Observable<DriverLocation> {
    return this.wsService.getDriverLocationUpdates();
  }
}