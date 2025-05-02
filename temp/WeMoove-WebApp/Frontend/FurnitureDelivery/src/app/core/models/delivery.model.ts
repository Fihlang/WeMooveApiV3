import { User } from './user.model';
import { Driver } from './driver.model';
import { Furniture } from './furniture.model';

export interface Delivery {
  id: number;
  customerId: number;
  driverId?: number;
  status: 'pending' | 'assigned' | 'in_progress' | 'delivered' | 'completed' | 'cancelled';
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationAddress: string;
  destinationLatitude: number;
  destinationLongitude: number;
  scheduledDate: Date;
  completedDate?: Date;
  specialInstructions?: string;
  totalPrice: number;
  distance: number; // in km
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryItem {
  id: number;
  deliveryId: number;
  furnitureId: number;
  furniture?: Furniture;
  quantity: number;
  specialHandling: boolean;
}

export interface DeliveryWithItems extends Delivery {
  customer: User;
  driver?: Driver & { user: User };
  items: (DeliveryItem & { furniture: Furniture })[];
}

export interface CreateDeliveryRequest {
  customerId: number;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationAddress: string;
  destinationLatitude: number;
  destinationLongitude: number;
  scheduledDate: Date;
  specialInstructions?: string;
  totalPrice: number;
  distance: number;
  items: {
    furnitureId: number;
    quantity: number;
    specialHandling: boolean;
  }[];
}