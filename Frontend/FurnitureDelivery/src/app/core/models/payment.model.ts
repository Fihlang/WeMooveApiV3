export interface Payment {
  id: number;
  deliveryId: number;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'cash';
  transactionId?: string;
  createdAt: Date;
}

export interface CreatePaymentRequest {
  deliveryId: number;
  amount: number;
  paymentMethod: string;
}