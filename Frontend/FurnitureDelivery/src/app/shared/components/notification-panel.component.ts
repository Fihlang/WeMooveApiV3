import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { Notification, NotificationType } from '../../core/models/notification.model';

@Component({
  selector: 'app-notification-panel',
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss']
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  isPanelOpen: boolean = false;
  isLoading: boolean = false;
  
  private notificationSubscription: Subscription | null = null;
  private countSubscription: Subscription | null = null;
  
  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) { }
  
  ngOnInit(): void {
    this.countSubscription = this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    
    this.notificationSubscription = this.notificationService.notification$.subscribe(notification => {
      this.notifications = [notification, ...this.notifications].slice(0, 20); // Keep only the 20 most recent
    });
  }
  
  ngOnDestroy(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    
    if (this.countSubscription) {
      this.countSubscription.unsubscribe();
    }
  }
  
  togglePanel(): void {
    this.isPanelOpen = !this.isPanelOpen;
    
    if (this.isPanelOpen && this.notifications.length === 0) {
      this.loadNotifications();
    }
  }
  
  loadNotifications(): void {
    this.isLoading = true;
    
    this.notificationService.getAllNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
        this.isLoading = false;
      }
    });
  }
  
  markAsRead(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: (updatedNotification) => {
          const index = this.notifications.findIndex(n => n.id === notification.id);
          if (index !== -1) {
            this.notifications[index].isRead = true;
          }
        },
        error: (err) => {
          console.error('Error marking notification as read:', err);
        }
      });
    }
  }
  
  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(notification => {
          notification.isRead = true;
        });
      },
      error: (err) => {
        console.error('Error marking all notifications as read:', err);
      }
    });
  }
  
  handleNotificationClick(notification: Notification): void {
    this.markAsRead(notification);
    
    // Navigate based on notification type and referenceId
    if (notification.referenceId) {
      switch (notification.type) {
        case NotificationType.BOOKING_REQUEST:
        case NotificationType.BOOKING_STATUS:
          this.router.navigate(['/customer/bookings', notification.referenceId]);
          break;
          
        case NotificationType.PAYMENT:
          this.router.navigate(['/customer/payments', notification.referenceId]);
          break;
          
        case NotificationType.REVIEW:
          this.router.navigate(['/customer/reviews', notification.referenceId]);
          break;
          
        case NotificationType.DELIVERY:
          this.router.navigate(['/customer/deliveries', notification.referenceId]);
          break;
          
        default:
          // For system notifications or unknown types, just mark as read
          break;
      }
    }
    
    // Close the panel after handling the notification
    this.isPanelOpen = false;
  }
  
  getNotificationIcon(type: string): string {
    switch (type) {
      case NotificationType.BOOKING_REQUEST:
        return 'bi-calendar-plus';
      case NotificationType.BOOKING_STATUS:
        return 'bi-calendar-check';
      case NotificationType.PAYMENT:
        return 'bi-credit-card';
      case NotificationType.REVIEW:
        return 'bi-star';
      case NotificationType.DELIVERY:
        return 'bi-truck';
      case NotificationType.SYSTEM:
        return 'bi-gear';
      default:
        return 'bi-bell';
    }
  }
  
  getTimeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) {
      return 'just now';
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const days = Math.floor(hours / 24);
    if (days < 30) {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    
    const months = Math.floor(days / 30);
    if (months < 12) {
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    
    const years = Math.floor(months / 12);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}