export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'delivery_status' | 'chat_message' | 'payment_status' | 'system';
  referenceId?: number; // ID of the related entity (delivery, message, etc.)
  isRead: boolean;
  createdAt: Date;
}

export interface CreateNotificationRequest {
  userId: number;
  title: string;
  message: string;
  type: string;
  referenceId?: number;
}