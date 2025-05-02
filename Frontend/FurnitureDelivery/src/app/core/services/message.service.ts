import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { WebSocketService } from './websocket.service';
import { Observable, tap } from 'rxjs';
import { Message, CreateMessageRequest } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(
    private httpService: HttpService,
    private wsService: WebSocketService
  ) {}

  /**
   * Get messages for a delivery
   * @param deliveryId Delivery ID
   */
  getDeliveryMessages(deliveryId: number): Observable<Message[]> {
    return this.httpService.get<Message[]>(`deliveries/${deliveryId}/messages`);
  }

  /**
   * Create a new message
   * @param message Message data
   */
  sendMessage(message: CreateMessageRequest): Observable<Message> {
    return this.httpService.post<Message>('messages', message).pipe(
      tap(createdMessage => {
        // Send WebSocket update
        this.wsService.sendNewMessage(createdMessage);
      })
    );
  }

  /**
   * Mark a message as read
   * @param messageId Message ID
   */
  markMessageAsRead(messageId: number): Observable<Message> {
    return this.httpService.put<Message>(`messages/${messageId}/read`, {});
  }

  /**
   * Subscribe to new messages
   */
  getNewMessages(): Observable<{ message: any }> {
    return this.wsService.getNewMessages();
  }
}