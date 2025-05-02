import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';

import { DeliveryService } from '../../core/services/delivery.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { AuthService } from '../../core/services/auth.service';
import { Delivery } from '../../models/delivery.model';
import { DeliveryItem } from '../../models/delivery-item.model';
import { Driver } from '../../models/driver.model';
import { Message } from '../../models/message.model';

interface DeliveryStatusUpdate {
  status: string;
  timestamp: Date;
  note?: string;
}

@Component({
  selector: 'app-delivery-tracking',
  templateUrl: './delivery-tracking.component.html',
  styleUrls: ['./delivery-tracking.component.scss'],
  providers: [DatePipe]
})
export class DeliveryTrackingComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  deliveryId: number | null = null;
  delivery: Delivery | null = null;
  deliveryItems: DeliveryItem[] = [];
  driver: Driver | null = null;
  loading = true;
  error: string | null = null;
  currentUserId: number;
  
  // Chat functionality
  messages: Message[] = [];
  newMessage: string = '';
  
  // Map
  map: any;
  driverMarker: any;
  destinationMarker: any;
  routePath: any;
  
  private subscriptions: Subscription[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private deliveryService: DeliveryService,
    private websocketService: WebSocketService,
    private authService: AuthService,
    private datePipe: DatePipe
  ) {
    this.currentUserId = this.authService.getCurrentUserId();
  }

  ngOnInit(): void {
    // Get delivery ID from route params
    this.route.params.subscribe(params => {
      this.deliveryId = +params['id']; // Convert to number
      this.loadDeliveryDetails();
    });
    
    // Subscribe to real-time updates
    this.subscriptions.push(
      this.websocketService.getMessagesByType('delivery_location_update').subscribe(payload => {
        if (payload.deliveryId === this.deliveryId) {
          this.handleLocationUpdate(payload);
        }
      })
    );
    
    this.subscriptions.push(
      this.websocketService.getMessagesByType('delivery_status_update').subscribe(payload => {
        if (payload.deliveryId === this.deliveryId) {
          this.handleStatusUpdate(payload);
        }
      })
    );
    
    this.subscriptions.push(
      this.websocketService.getMessagesByType('chat_message').subscribe(payload => {
        if (payload.deliveryId === this.deliveryId) {
          this.handleNewMessage(payload);
        }
      })
    );
  }

  ngAfterViewInit(): void {
    // Initialize map if delivery data is available
    if (this.delivery && this.mapContainer) {
      this.initializeMap();
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadDeliveryDetails(): void {
    if (!this.deliveryId) return;
    
    this.loading = true;
    this.error = null;
    
    // Load full delivery details with items
    this.subscriptions.push(
      this.deliveryService.getDeliveryWithItems(this.deliveryId).subscribe({
        next: (response) => {
          this.delivery = response.delivery;
          this.deliveryItems = response.items;
          
          // If driver is assigned, get driver details
          if (this.delivery?.driverId) {
            this.loadDriverDetails(this.delivery.driverId);
          }
          
          // Load chat history
          this.loadChatHistory();
          
          this.loading = false;
          
          // Initialize map after data is loaded
          if (this.mapContainer && this.mapContainer.nativeElement) {
            setTimeout(() => {
              this.initializeMap();
            }, 500);
          }
        },
        error: (error) => {
          console.error('Error fetching delivery details:', error);
          this.error = 'Failed to load delivery information. Please try again.';
          this.loading = false;
        }
      })
    );
  }

  loadDriverDetails(driverId: number): void {
    this.subscriptions.push(
      this.deliveryService.getDriverDetails(driverId).subscribe({
        next: (driver) => {
          this.driver = driver;
          
          // Update map with driver location if map is initialized
          if (this.map && driver.currentLatitude && driver.currentLongitude) {
            this.updateDriverMarker(driver.currentLatitude, driver.currentLongitude);
          }
        },
        error: (error) => {
          console.error('Error fetching driver details:', error);
        }
      })
    );
  }

  loadChatHistory(): void {
    if (!this.deliveryId) return;
    
    this.subscriptions.push(
      this.deliveryService.getChatMessages(this.deliveryId).subscribe({
        next: (messages) => {
          this.messages = messages;
          
          // Scroll to bottom of messages
          setTimeout(() => {
            this.scrollToBottomOfMessages();
          }, 100);
        },
        error: (error) => {
          console.error('Error fetching chat history:', error);
        }
      })
    );
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.deliveryId) return;
    
    // Add current timestamp
    const messageToSend = {
      text: this.newMessage.trim(),
      senderId: this.currentUserId,
      deliveryId: this.deliveryId,
      timestamp: new Date()
    };
    
    this.subscriptions.push(
      this.deliveryService.sendChatMessage(this.deliveryId, this.newMessage).subscribe({
        next: (_) => {
          // Add message to UI immediately for better UX
          this.messages.push(messageToSend as Message);
          this.newMessage = '';
          
          // Scroll to bottom
          this.scrollToBottomOfMessages();
        },
        error: (error) => {
          console.error('Error sending message:', error);
        }
      })
    );
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return this.datePipe.transform(dateObj, 'MMM d, y h:mm a') || 'Invalid date';
  }

  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'pending': 'schedule',
      'driver_assigned': 'person',
      'picked_up': 'inventory_2',
      'in_transit': 'local_shipping',
      'out_for_delivery': 'delivery_dining',
      'delivered': 'check_circle',
      'cancelled': 'cancel'
    };
    
    return iconMap[status] || 'help';
  }

  getStatusCompletionPercentage(): number {
    if (!this.delivery) return 0;
    
    const statusOrder = [
      'pending',
      'driver_assigned',
      'picked_up',
      'in_transit',
      'out_for_delivery',
      'delivered'
    ];
    
    if (this.delivery.status === 'cancelled') return 0;
    
    const currentIndex = statusOrder.indexOf(this.delivery.status);
    if (currentIndex === -1) return 0;
    
    return (currentIndex / (statusOrder.length - 1)) * 100;
  }
  
  isStepActive(status: string): boolean {
    if (!this.delivery) return false;
    
    const statusOrder = [
      'pending',
      'driver_assigned',
      'picked_up',
      'in_transit',
      'delivered'
    ];
    
    const currentIndex = statusOrder.indexOf(this.delivery.status);
    const stepIndex = statusOrder.indexOf(status);
    
    return stepIndex <= currentIndex;
  }
  
  getDriverInitials(): string {
    if (!this.delivery || !this.delivery.driverName) return 'D';
    
    const nameParts = this.delivery.driverName.split(' ');
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    
    return nameParts[0][0].toUpperCase();
  }
  
  getStarsArray(rating: number): ('full' | 'half' | 'empty')[] {
    if (!rating) return Array(5).fill('empty');
    
    const result: ('full' | 'half' | 'empty')[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      result.push('full');
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      result.push('half');
    }
    
    // Fill the rest with empty stars
    while (result.length < 5) {
      result.push('empty');
    }
    
    return result;
  }

  openChat(): void {
    // This could open a chat modal or expand chat section
    console.log('Opening chat with driver');
  }

  callDriver(): void {
    if (this.delivery && this.delivery.driverPhone) {
      window.location.href = `tel:${this.delivery.driverPhone}`;
    }
  }

  private initializeMap(): void {
    if (!this.delivery || !this.mapContainer) return;
    
    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || !google.maps) {
      console.error('Google Maps API not loaded');
      return;
    }
    
    // Create map centered at destination
    const destinationCoords = { 
      lat: this.delivery.destinationLatitude || 0, 
      lng: this.delivery.destinationLongitude || 0 
    };
    
    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: destinationCoords,
      zoom: 13,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      styles: [
        {
          "featureType": "administrative",
          "elementType": "geometry.fill",
          "stylers": [{"color": "#d6e2e6"}]
        },
        {
          "featureType": "administrative",
          "elementType": "geometry.stroke",
          "stylers": [{"color": "#cddbe0"}]
        },
        {
          "featureType": "administrative",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#7492a8"}]
        },
        {
          "featureType": "administrative.neighborhood",
          "elementType": "labels.text.fill",
          "stylers": [{"lightness": 25}]
        },
        {
          "featureType": "landscape.man_made",
          "elementType": "geometry.fill",
          "stylers": [{"color": "#dde2e3"}]
        },
        {
          "featureType": "landscape.man_made",
          "elementType": "geometry.stroke",
          "stylers": [{"color": "#cdd5db"}]
        },
        {
          "featureType": "landscape.natural",
          "elementType": "geometry.fill",
          "stylers": [{"color": "#dde2e3"}]
        },
        {
          "featureType": "landscape.natural",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#7492a8"}]
        },
        {
          "featureType": "landscape.natural.terrain",
          "elementType": "all",
          "stylers": [{"visibility": "off"}]
        },
        {
          "featureType": "poi",
          "elementType": "geometry.fill",
          "stylers": [{"color": "#dde2e3"}]
        },
        {
          "featureType": "poi",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#8a8a8a"}]
        },
        {
          "featureType": "poi",
          "elementType": "labels.icon",
          "stylers": [{"saturation": -100}]
        },
        {
          "featureType": "poi.park",
          "elementType": "geometry.fill",
          "stylers": [{"color": "#c9e2cd"}]
        },
        {
          "featureType": "poi.sports_complex",
          "elementType": "geometry.fill",
          "stylers": [{"color": "#c9e2cd"}]
        },
        {
          "featureType": "road",
          "elementType": "geometry.fill",
          "stylers": [{"color": "#ffffff"}]
        },
        {
          "featureType": "road",
          "elementType": "geometry.stroke",
          "stylers": [{"color": "#d9d9d9"}]
        },
        {
          "featureType": "road",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#666666"}]
        },
        {
          "featureType": "road.highway",
          "elementType": "geometry.fill",
          "stylers": [{"color": "#f5f5f5"}]
        },
        {
          "featureType": "road.highway",
          "elementType": "geometry.stroke",
          "stylers": [{"color": "#c9c9c9"}]
        },
        {
          "featureType": "road.arterial",
          "elementType": "geometry.fill",
          "stylers": [{"color": "#ffffff"}]
        },
        {
          "featureType": "transit.line",
          "elementType": "all",
          "stylers": [{"visibility": "simplified"}]
        },
        {
          "featureType": "transit.station",
          "elementType": "all",
          "stylers": [{"visibility": "on"}]
        },
        {
          "featureType": "water",
          "elementType": "geometry.fill",
          "stylers": [{"color": "#b4d0e9"}]
        }
      ]
    });
    
    // Add destination marker
    this.destinationMarker = new google.maps.Marker({
      position: destinationCoords,
      map: this.map,
      icon: {
        url: 'assets/images/destination-marker.png', // Custom marker image
        scaledSize: new google.maps.Size(36, 36)
      },
      title: 'Delivery Destination'
    });
    
    // Add driver marker if driver location is available
    if (this.driver && this.driver.currentLatitude && this.driver.currentLongitude) {
      const driverCoords = {
        lat: this.driver.currentLatitude,
        lng: this.driver.currentLongitude
      };
      
      this.updateDriverMarker(driverCoords.lat, driverCoords.lng);
      
      // Draw route from driver to destination
      this.drawRoute(driverCoords, destinationCoords);
    }
  }
  
  private updateDriverMarker(lat: number, lng: number): void {
    if (!this.map) return;
    
    const driverCoords = { lat, lng };
    
    if (this.driverMarker) {
      // Update existing marker position
      this.driverMarker.setPosition(driverCoords);
    } else {
      // Create new marker
      this.driverMarker = new google.maps.Marker({
        position: driverCoords,
        map: this.map,
        icon: {
          url: 'assets/images/truck-marker.png', // Custom marker image
          scaledSize: new google.maps.Size(40, 40)
        },
        title: this.delivery?.driverName || 'Driver'
      });
    }
    
    // Update route
    if (this.destinationMarker) {
      this.drawRoute(driverCoords, this.destinationMarker.getPosition().toJSON());
    }
    
    // Adjust map bounds to show both markers
    this.adjustMapBounds();
  }
  
  private drawRoute(origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral): void {
    if (!this.map) return;
    
    // Remove existing route
    if (this.routePath) {
      this.routePath.setMap(null);
    }
    
    // Draw new route
    this.routePath = new google.maps.Polyline({
      path: [origin, destination],
      geodesic: true,
      strokeColor: '#5e62f7', // Primary color
      strokeOpacity: 0.8,
      strokeWeight: 4
    });
    
    this.routePath.setMap(this.map);
  }
  
  private adjustMapBounds(): void {
    if (!this.map || !this.driverMarker || !this.destinationMarker) return;
    
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(this.driverMarker.getPosition());
    bounds.extend(this.destinationMarker.getPosition());
    
    this.map.fitBounds(bounds);
    
    // Add some padding to the bounds
    const padding = { top: 50, right: 50, bottom: 50, left: 50 };
    this.map.fitBounds(bounds, padding);
  }
  
  private scrollToBottomOfMessages(): void {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  private handleLocationUpdate(payload: any): void {
    if (this.delivery && this.driver) {
      // Update driver's location
      this.driver.currentLatitude = payload.latitude;
      this.driver.currentLongitude = payload.longitude;
      
      // Update map marker
      this.updateDriverMarker(payload.latitude, payload.longitude);
      
      // Update ETA and last updated time if provided
      if (payload.estimatedArrival) {
        if (!this.delivery.tracking) {
          this.delivery.tracking = { lastUpdated: new Date(), estimatedArrival: new Date(payload.estimatedArrival) };
        } else {
          this.delivery.tracking.estimatedArrival = new Date(payload.estimatedArrival);
          this.delivery.tracking.lastUpdated = new Date();
        }
      }
    }
  }

  private handleStatusUpdate(payload: any): void {
    if (this.delivery) {
      // Update delivery status
      const previousStatus = this.delivery.status;
      this.delivery.status = payload.status;
      
      // Add status update to timeline if it's a new status
      if (previousStatus !== payload.status) {
        if (!this.delivery.statusUpdates) {
          this.delivery.statusUpdates = [];
        }
        
        const statusUpdate: DeliveryStatusUpdate = {
          status: payload.status,
          timestamp: new Date(),
          note: payload.note
        };
        
        this.delivery.statusUpdates.push(statusUpdate);
      }
      
      // Update other fields if provided
      if (payload.estimatedArrival) {
        if (!this.delivery.tracking) {
          this.delivery.tracking = { lastUpdated: new Date(), estimatedArrival: new Date(payload.estimatedArrival) };
        } else {
          this.delivery.tracking.estimatedArrival = new Date(payload.estimatedArrival);
          this.delivery.tracking.lastUpdated = new Date();
        }
      }
    }
  }

  private handleNewMessage(payload: any): void {
    // Add the new message to the message list
    this.messages.push(payload.message);
    
    // Scroll to bottom
    this.scrollToBottomOfMessages();
  }
}