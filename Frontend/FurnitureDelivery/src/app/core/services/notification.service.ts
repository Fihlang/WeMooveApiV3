import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';
import { WebSocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.apiUrl;
  private unreadNotificationsCount = new BehaviorSubject<number>(0);
  private newNotification = new Subject<Notification>();

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService
  ) {
    // Initialize WebSocket connection and subscribe to notifications
    this.wsService.connect();
    this.wsService.on('notification_received', (data: Notification) => {
      this.updateUnreadCount(1);
      this.newNotification.next(data);
    });
    
    // Load initial unread count
    this.loadUnreadCount();
  }

  get unreadCount$(): Observable<number> {
    return this.unreadNotificationsCount.asObservable();
  }

  get notification$(): Observable<Notification> {
    return this.newNotification.asObservable();
  }

  private loadUnreadCount(): void {
    this.getUnreadNotifications().subscribe({
      next: (notifications) => {
        this.unreadNotificationsCount.next(notifications.length);
      },
      error: (err) => {
        console.error('Error loading unread notifications count:', err);
      }
    });
  }

  private updateUnreadCount(delta: number): void {
    const currentCount = this.unreadNotificationsCount.value;
    this.unreadNotificationsCount.next(currentCount + delta);
  }

  getNotification(id: number): Observable<Notification> {
    return this.http.get<Notification>(`${this.apiUrl}/notifications/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getAllNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/notifications/user`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/notifications/user?unreadOnly=true`)
      .pipe(
        catchError(this.handleError)
      );
  }

  markAsRead(id: number): Observable<Notification> {
    return this.http.put<Notification>(`${this.apiUrl}/notifications/${id}/read`, {})
      .pipe(
        tap(() => this.updateUnreadCount(-1)),
        catchError(this.handleError)
      );
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/notifications/mark-all-read`, {})
      .pipe(
        tap(() => this.unreadNotificationsCount.next(0)),
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