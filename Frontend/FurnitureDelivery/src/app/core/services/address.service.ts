import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Address, CreateAddressRequest } from '../models/address.model';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private baseUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) { }

  /**
   * Get addresses for a user
   */
  getUserAddresses(userId: number): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.baseUrl}/users/${userId}/addresses`);
  }

  /**
   * Get a specific address by ID
   */
  getAddress(id: number): Observable<Address> {
    return this.http.get<Address>(`${this.baseUrl}/addresses/${id}`);
  }

  /**
   * Create a new address
   */
  createAddress(address: CreateAddressRequest): Observable<Address> {
    return this.http.post<Address>(`${this.baseUrl}/addresses`, address);
  }

  /**
   * Update an existing address
   */
  updateAddress(id: number, address: Partial<Address>): Observable<Address> {
    return this.http.put<Address>(`${this.baseUrl}/addresses/${id}`, address);
  }

  /**
   * Delete an address
   */
  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/addresses/${id}`);
  }

  /**
   * Set an address as the default
   */
  setDefaultAddress(id: number): Observable<Address> {
    return this.http.put<Address>(`${this.baseUrl}/addresses/${id}/default`, {});
  }
}