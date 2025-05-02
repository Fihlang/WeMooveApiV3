export interface Delivery {
  id: number;
  customerId: number;
  driverId: number | null;
  status: string;
  scheduledDate: Date;
  pickupAddress: string;
  destinationAddress: string;
  totalPrice: number;
  distance: number | null;
  instructions: string | null;
  createdAt: Date;
  updatedAt: Date;
  estimatedArrival: Date | null;
  actualPickupTime: Date | null;
  actualDeliveryTime: Date | null;
}

export interface DeliveryWithItems extends Delivery {
  items: any[];
  driver?: any;
  customer?: any;
}