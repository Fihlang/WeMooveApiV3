import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
  
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // First check if the user is authenticated
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }
    
    // Get required role from route data
    const requiredRole = route.data['requiredRole'];
    
    // If no role specified in route, allow access
    if (!requiredRole) {
      return true;
    }
    
    // Get user
    const user = this.authService.currentUserValue;
    
    // Check if user has the required role
    if (user && user.userType === requiredRole) {
      return true;
    }
    
    // User does not have the required role, redirect to appropriate area
    // based on their actual role
    if (user?.userType === 'driver') {
      this.router.navigate(['/driver/dashboard']);
    } else {
      this.router.navigate(['/customer/dashboard']);
    }
    
    return false;
  }
}