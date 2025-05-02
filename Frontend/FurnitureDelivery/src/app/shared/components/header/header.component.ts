import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule
  ],
  template: `
    <mat-toolbar color="primary" class="header">
      <div class="container">
        <a class="logo" routerLink="/">
          <span>Furniture Delivery</span>
        </a>
        
        <span class="spacer"></span>
        
        <div class="nav-links">
          <ng-container *ngIf="!isLoggedIn">
            <a mat-button routerLink="/auth/login">Login</a>
            <a mat-raised-button routerLink="/auth/register">Sign Up</a>
          </ng-container>
          
          <ng-container *ngIf="isLoggedIn">
            <ng-container *ngIf="userType === 'customer'">
              <a mat-button routerLink="/customer/dashboard">Dashboard</a>
              <a mat-button routerLink="/customer/deliveries">My Deliveries</a>
            </ng-container>
            
            <ng-container *ngIf="userType === 'driver'">
              <a mat-button routerLink="/driver/dashboard">Dashboard</a>
              <a mat-button routerLink="/driver/deliveries">My Jobs</a>
            </ng-container>
            
            <button mat-icon-button [matMenuTriggerFor]="notificationMenu" aria-label="Notifications" class="notification-btn">
              <mat-icon matBadge="{{unreadNotifications}}" matBadgeColor="warn" [matBadgeHidden]="unreadNotifications === 0">notifications</mat-icon>
            </button>
            
            <mat-menu #notificationMenu="matMenu" class="notification-menu">
              <div class="notification-header">
                <h3>Notifications</h3>
                <button mat-button color="primary" *ngIf="hasNotifications" (click)="markAllAsRead()">
                  Mark all as read
                </button>
              </div>
              
              <div class="notification-list" *ngIf="hasNotifications">
                <div class="notification-item" *ngFor="let notification of notifications">
                  <div class="notification-content">
                    <h4>{{ notification.title }}</h4>
                    <p>{{ notification.message }}</p>
                    <small>{{ notification.createdAt | date:'short' }}</small>
                  </div>
                  <button mat-icon-button (click)="markAsRead(notification.id)" *ngIf="!notification.isRead">
                    <mat-icon>check</mat-icon>
                  </button>
                </div>
              </div>
              
              <div class="empty-notifications" *ngIf="!hasNotifications">
                <p>No notifications</p>
              </div>
            </mat-menu>
            
            <button mat-button [matMenuTriggerFor]="profileMenu" class="profile-btn">
              <mat-icon>account_circle</mat-icon>
              {{ userName }}
            </button>
            
            <mat-menu #profileMenu="matMenu">
              <a mat-menu-item routerLink="/profile">
                <mat-icon>person</mat-icon>
                <span>Profile</span>
              </a>
              <a mat-menu-item routerLink="/settings">
                <mat-icon>settings</mat-icon>
                <span>Settings</span>
              </a>
              <button mat-menu-item (click)="logout()">
                <mat-icon>exit_to_app</mat-icon>
                <span>Logout</span>
              </button>
            </mat-menu>
          </ng-container>
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .header {
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    
    .container {
      display: flex;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      align-items: center;
    }
    
    .logo {
      text-decoration: none;
      color: white;
      font-size: 1.2rem;
      font-weight: 500;
    }
    
    .spacer {
      flex: 1 1 auto;
    }
    
    .nav-links {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .profile-btn {
      display: flex;
      align-items: center;
    }
    
    .notification-menu {
      min-width: 300px;
      max-width: 350px;
    }
    
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }
    
    .notification-header h3 {
      margin: 0;
      font-size: 16px;
    }
    
    .notification-list {
      max-height: 300px;
      overflow-y: auto;
    }
    
    .notification-item {
      display: flex;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }
    
    .notification-content {
      flex: 1;
    }
    
    .notification-content h4 {
      margin: 0 0 4px 0;
      font-size: 14px;
    }
    
    .notification-content p {
      margin: 0 0 4px 0;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .notification-content small {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.5);
    }
    
    .empty-notifications {
      padding: 16px;
      text-align: center;
      color: rgba(0, 0, 0, 0.5);
    }
  `]
})
export class HeaderComponent implements OnInit {
  isLoggedIn = false;
  userType = '';
  userName = '';
  unreadNotifications = 0;
  hasNotifications = false;
  notifications: any[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      if (user) {
        this.userType = user.userType;
        this.userName = `${user.firstName} ${user.lastName}`;
        this.loadNotifications();
      }
    });
  }

  loadNotifications(): void {
    // In a real app, this would come from a notification service
    this.notifications = [
      {
        id: 1,
        title: 'New driver assigned',
        message: 'John Doe has been assigned to your delivery #123',
        createdAt: new Date(),
        isRead: false
      },
      {
        id: 2,
        title: 'Delivery status updated',
        message: 'Your delivery #123 is now in transit',
        createdAt: new Date(Date.now() - 3500000), // 1 hour ago
        isRead: true
      }
    ];
    
    this.unreadNotifications = this.notifications.filter(n => !n.isRead).length;
    this.hasNotifications = this.notifications.length > 0;
  }

  markAsRead(id: number): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
      this.unreadNotifications = this.notifications.filter(n => !n.isRead).length;
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.isRead = true);
    this.unreadNotifications = 0;
  }

  logout(): void {
    this.authService.logout();
  }
}