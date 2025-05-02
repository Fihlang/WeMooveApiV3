import { Furniture } from './furniture.model';

export interface DeliveryItem {
  id: number;
  deliveryId: number;
  furnitureId: number;
  quantity: number;
  specialHandling: boolean;
}

export interface DeliveryItemWithDetails extends DeliveryItem {
  furniture: Furniture;
}