import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { WebSocketService } from './core/services/websocket.service';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <!-- Navigation will be added here -->
      <router-outlet></router-outlet>
      <!-- Footer will be added here -->
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Furniture Delivery';

  constructor(
    private authService: AuthService,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit() {
    // Automatically connect to WebSocket if user is authenticated
    // (this is also handled in the WebSocketService constructor)
    if (this.authService.isAuthenticated) {
      this.webSocketService.connect();
    }
  }
}