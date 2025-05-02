import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Performs an HTTP GET request
   * @param endpoint - API endpoint (without base URL)
   * @param options - Optional HTTP options
   */
  get<T>(endpoint: string, options: {
    headers?: HttpHeaders | { [header: string]: string | string[] },
    params?: HttpParams | { [param: string]: string | string[] | number | boolean | readonly (string | string[] | number | boolean)[] },
    reportProgress?: boolean,
    withCredentials?: boolean
  } = {}): Observable<T> {
    const url = this.createUrl(endpoint);
    const httpOptions = this.createOptions(options);

    return this.http.get<T>(url, httpOptions)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Performs an HTTP POST request
   * @param endpoint - API endpoint (without base URL)
   * @param body - Request body
   * @param options - Optional HTTP options
   */
  post<T>(endpoint: string, body: any, options: {
    headers?: HttpHeaders | { [header: string]: string | string[] },
    params?: HttpParams | { [param: string]: string | string[] | number | boolean | readonly (string | string[] | number | boolean)[] },
    reportProgress?: boolean,
    withCredentials?: boolean
  } = {}): Observable<T> {
    const url = this.createUrl(endpoint);
    const httpOptions = this.createOptions(options);

    return this.http.post<T>(url, body, httpOptions)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Performs an HTTP PUT request
   * @param endpoint - API endpoint (without base URL)
   * @param body - Request body
   * @param options - Optional HTTP options
   */
  put<T>(endpoint: string, body: any, options: {
    headers?: HttpHeaders | { [header: string]: string | string[] },
    params?: HttpParams | { [param: string]: string | string[] | number | boolean | readonly (string | string[] | number | boolean)[] },
    reportProgress?: boolean,
    withCredentials?: boolean
  } = {}): Observable<T> {
    const url = this.createUrl(endpoint);
    const httpOptions = this.createOptions(options);

    return this.http.put<T>(url, body, httpOptions)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Performs an HTTP PATCH request
   * @param endpoint - API endpoint (without base URL)
   * @param body - Request body
   * @param options - Optional HTTP options
   */
  patch<T>(endpoint: string, body: any, options: {
    headers?: HttpHeaders | { [header: string]: string | string[] },
    params?: HttpParams | { [param: string]: string | string[] | number | boolean | readonly (string | string[] | number | boolean)[] },
    reportProgress?: boolean,
    withCredentials?: boolean
  } = {}): Observable<T> {
    const url = this.createUrl(endpoint);
    const httpOptions = this.createOptions(options);

    return this.http.patch<T>(url, body, httpOptions)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Performs an HTTP DELETE request
   * @param endpoint - API endpoint (without base URL)
   * @param options - Optional HTTP options
   */
  delete<T>(endpoint: string, options: {
    headers?: HttpHeaders | { [header: string]: string | string[] },
    params?: HttpParams | { [param: string]: string | string[] | number | boolean | readonly (string | string[] | number | boolean)[] },
    reportProgress?: boolean,
    withCredentials?: boolean,
    body?: any
  } = {}): Observable<T> {
    const url = this.createUrl(endpoint);
    const httpOptions = this.createOptions(options);

    return this.http.delete<T>(url, httpOptions)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Creates complete URL by combining API base URL with endpoint
   */
  private createUrl(endpoint: string): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `${environment.apiUrl}/${cleanEndpoint}`;
  }

  /**
   * Creates HTTP options with auth token (if available)
   */
  private createOptions(options: any): any {
    const token = this.authService.tokenValue;
    if (!token) {
      return options;
    }

    // Clone the headers to avoid modifying the original
    const headers = options.headers ? 
      new HttpHeaders(options.headers) : 
      new HttpHeaders();

    // Add Authorization header with JWT token
    const authHeaders = headers.set('Authorization', `Bearer ${token}`);
    
    return {
      ...options,
      headers: authHeaders
    };
  }

  /**
   * Error handler
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Error Code: ${error.status}, Message: ${error.message}`;
      
      // Handle 401 Unauthorized error
      if (error.status === 401) {
        this.authService.logout();
      }
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}