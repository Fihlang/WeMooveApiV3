import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 3000; // 3 seconds
  private eventHandlers: { [event: string]: ((data: any) => void)[] } = {};
  private isConnected = false;
  
  constructor() {}
  
  connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket connection already established or connecting');
      return;
    }
    
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const eventType = data.type;
          const payload = data.payload;
          
          if (eventType && this.eventHandlers[eventType]) {
            this.eventHandlers[eventType].forEach(handler => {
              handler(payload);
            });
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      this.socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        this.isConnected = false;
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => this.connect(), this.reconnectTimeout);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
  
  on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    
    this.eventHandlers[event].push(handler);
  }
  
  off(event: string, handler?: (data: any) => void): void {
    if (!this.eventHandlers[event]) return;
    
    if (handler) {
      const index = this.eventHandlers[event].indexOf(handler);
      if (index !== -1) {
        this.eventHandlers[event].splice(index, 1);
      }
    } else {
      delete this.eventHandlers[event];
    }
  }
  
  emit(event: string, data: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }
    
    const message = JSON.stringify({
      type: event,
      payload: data
    });
    
    this.socket.send(message);
  }
  
  isSocketConnected(): boolean {
    return this.isConnected;
  }
}