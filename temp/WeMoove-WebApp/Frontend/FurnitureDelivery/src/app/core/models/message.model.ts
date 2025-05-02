export interface Message {
  id: number;
  deliveryId: number;
  senderId: number;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export interface CreateMessageRequest {
  deliveryId: number;
  senderId: number;
  content: string;
}