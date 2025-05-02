export interface Review {
  id: number;
  deliveryId: number;
  customerId: number;
  driverId: number;
  rating: number; // 1-5 stars
  comment?: string;
  createdAt: Date;
}

export interface CreateReviewRequest {
  deliveryId: number;
  customerId: number;
  driverId: number;
  rating: number;
  comment?: string;
}