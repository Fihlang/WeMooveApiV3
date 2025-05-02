import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../../models/user.model';

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private userKey = 'current_user';
  
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  
  constructor(private http: HttpClient) {
    // Get user from local storage if available
    const storedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser = this.currentUserSubject.asObservable();
  }
  
  /**
   * Get the current user as a behavior subject value
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
  
  /**
   * Check if user is authenticated
   */
  public get isAuthenticated(): boolean {
    return !!this.getAuthToken() && !!this.currentUserValue;
  }
  
  /**
   * Login with email and password
   */
  login(email: string, password: string): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => this.setSession(response)),
        map(response => response.user),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => new Error(error.error?.message || 'Login failed. Please check your credentials.'));
        })
      );
  }
  
  /**
   * Register a new user
   */
  register(userData: any): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        tap(response => this.setSession(response)),
        map(response => response.user),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => new Error(error.error?.message || 'Registration failed. Please try again.'));
        })
      );
  }
  
  /**
   * Logout the current user
   */
  logout(): void {
    // Remove token and user from local storage
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    // Update current user subject
    this.currentUserSubject.next(null);
  }
  
  /**
   * Get the current auth token
   */
  getAuthToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
  
  /**
   * Update user profile
   */
  updateProfile(userData: Partial<User>): Observable<User> {
    const userId = this.currentUserValue?.id;
    if (!userId) {
      return throwError(() => new Error('No authenticated user'));
    }
    
    return this.http.patch<User>(`${this.apiUrl}/users/${userId}`, userData)
      .pipe(
        tap(updatedUser => {
          // Update stored user
          const currentUser = this.currentUserValue;
          if (currentUser) {
            const newUser = { ...currentUser, ...updatedUser };
            this.storeUser(newUser);
            this.currentUserSubject.next(newUser);
          }
        }),
        catchError(error => {
          console.error('Update profile error:', error);
          return throwError(() => new Error(error.error?.message || 'Failed to update profile. Please try again.'));
        })
      );
  }
  
  /**
   * Change user password
   */
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const userId = this.currentUserValue?.id;
    if (!userId) {
      return throwError(() => new Error('No authenticated user'));
    }
    
    return this.http.post(`${this.apiUrl}/auth/change-password`, {
      userId,
      currentPassword,
      newPassword
    }).pipe(
      catchError(error => {
        console.error('Change password error:', error);
        return throwError(() => new Error(error.error?.message || 'Failed to change password. Please check your current password.'));
      })
    );
  }
  
  /**
   * Request password reset
   */
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email })
      .pipe(
        catchError(error => {
          console.error('Password reset request error:', error);
          return throwError(() => new Error(error.error?.message || 'Failed to request password reset. Please try again.'));
        })
      );
  }
  
  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, { token, newPassword })
      .pipe(
        catchError(error => {
          console.error('Password reset error:', error);
          return throwError(() => new Error(error.error?.message || 'Failed to reset password. The token may be invalid or expired.'));
        })
      );
  }
  
  /**
   * Store auth session data
   */
  private setSession(authResult: AuthResponse): void {
    // Store token and user in local storage
    localStorage.setItem(this.tokenKey, authResult.token);
    this.storeUser(authResult.user);
    // Update current user subject
    this.currentUserSubject.next(authResult.user);
  }
  
  /**
   * Store user in local storage
   */
  private storeUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }
  
  /**
   * Get stored user from local storage
   */
  private getStoredUser(): User | null {
    const userJson = localStorage.getItem(this.userKey);
    if (userJson) {
      try {
        return JSON.parse(userJson) as User;
      } catch (e) {
        console.error('Error parsing stored user:', e);
        return null;
      }
    }
    return null;
  }
}