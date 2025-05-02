import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DeliveryService } from '../../core/services/delivery.service';
import { AuthService } from '../../core/services/auth.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { Delivery } from '../../models/delivery.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  deliveries: Delivery[] = [];
  activeDeliveries: Delivery[] = [];
  completedDeliveries: Delivery[] = [];
  loading = true;
  error: string | null = null;
  
  // Notification counter
  unreadNotifications = 0;
  
  constructor(
    private router: Router,
    private deliveryService: DeliveryService,
    private authService: AuthService,
    private websocketService: WebSocketService
  ) { }

  ngOnInit(): void {
    // Get current user
    this.currentUser = this.authService.currentUserValue;
    
    // Load deliveries
    this.loadDeliveries();
    
    // Connect to WebSocket for real-time updates
    this.websocketService.connect();
    
    // Listen for notifications
    this.websocketService.getMessagesByType('notification').subscribe(payload => {
      if (payload.userId === this.currentUser?.id) {
        // Increment unread notifications counter
        this.unreadNotifications++;
        
        // Refresh deliveries list if the notification is about a delivery update
        if (payload.type === 'delivery_update') {
          this.loadDeliveries();
        }
      }
    });
  }

  loadDeliveries(): void {
    this.loading = true;
    this.error = null;
    
    this.deliveryService.getMyDeliveries().subscribe({
      next: (deliveries) => {
        this.deliveries = deliveries;
        
        // Filter active and completed deliveries
        this.activeDeliveries = deliveries.filter(d => 
          ['pending', 'accepted', 'picked_up', 'in_transit'].includes(d.status)
        );
        
        this.completedDeliveries = deliveries.filter(d => 
          ['delivered', 'cancelled'].includes(d.status)
        );
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching deliveries:', error);
        this.error = 'Failed to load deliveries. Please try again.';
        this.loading = false;
      }
    });
  }

  trackDelivery(deliveryId: number): void {
    this.router.navigate(['/delivery-tracking', deliveryId]);
  }

  createNewDelivery(): void {
    this.router.navigate(['/place-order']);
  }

  viewFurnitureCatalog(): void {
    this.router.navigate(['/furniture-catalog']);
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'warning',
      'accepted': 'info',
      'picked_up': 'info',
      'in_transit': 'primary',
      'delivered': 'success',
      'cancelled': 'danger'
    };
    
    return statusMap[status] || 'secondary';
  }

  formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Awaiting Driver Assignment',
      'accepted': 'Driver Assigned',
      'picked_up': 'Picked Up',
      'in_transit': 'In Transit',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    
    return statusMap[status] || status;
  }
}