import { Injectable } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WebSocketMessage {
  type: string;
  payload: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<WebSocketMessage>();
  private reconnectInterval = 5000; // 5 seconds
  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;
  private isConnecting = false;

  constructor() { }

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket is already connected or connecting');
      return;
    }

    if (this.isConnecting) {
      console.log('WebSocket connection attempt already in progress');
      return;
    }

    this.isConnecting = true;
    console.log('Connecting to WebSocket server...');
    
    try {
      this.socket = new WebSocket(environment.wsUrl);
      
      this.socket.onopen = (event) => {
        console.log('WebSocket connection established');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };
      
      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.messageSubject.next(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.socket = null;
        this.isConnecting = false;
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000) {
          this.tryReconnect();
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
      this.tryReconnect();
    }
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private tryReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.log('Maximum reconnect attempts reached. Please try refreshing the page.');
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Send a message through the WebSocket connection
   */
  sendMessage(type: string, payload: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = { type, payload };
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected. Cannot send message.');
      // Attempt to reconnect
      this.connect();
    }
  }

  /**
   * Get all messages from the WebSocket
   */
  getMessages(): Observable<WebSocketMessage> {
    return this.messageSubject.asObservable();
  }

  /**
   * Get messages filtered by type
   */
  getMessagesByType(type: string): Observable<any> {
    return this.messageSubject.asObservable().pipe(
      filter(message => message.type === type),
      map(message => message.payload)
    );
  }

  /**
   * Check if the WebSocket is currently connected
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}