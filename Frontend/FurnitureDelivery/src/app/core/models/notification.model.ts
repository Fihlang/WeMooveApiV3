export enum NotificationType {
  BOOKING_REQUEST = 'booking_request',
  BOOKING_STATUS = 'booking_status',
  PAYMENT = 'payment',
  REVIEW = 'review',
  DELIVERY = 'delivery',
  SYSTEM = 'system'
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType | string;
  referenceId?: number;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationBadge {
  count: number;
  type: NotificationType | string;
}