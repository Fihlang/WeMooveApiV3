import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { Furniture } from '../models/furniture.model';

@Injectable({
  providedIn: 'root'
})
export class FurnitureService {
  constructor(private httpService: HttpService) {}

  /**
   * Get all furniture items
   * @param category Optional category filter
   */
  getAllFurniture(category?: string): Observable<Furniture[]> {
    const params = category ? { category } : {};
    return this.httpService.get<Furniture[]>('furniture', params);
  }

  /**
   * Get a furniture item by ID
   * @param furnitureId Furniture ID
   */
  getFurniture(furnitureId: number): Observable<Furniture> {
    return this.httpService.get<Furniture>(`furniture/${furnitureId}`);
  }

  /**
   * Get furniture items by category
   * @param category Furniture category
   */
  getFurnitureByCategory(category: string): Observable<Furniture[]> {
    return this.httpService.get<Furniture[]>('furniture', { category });
  }

  /**
   * Create a new furniture item
   * @param furniture Furniture data
   */
  createFurniture(furniture: Partial<Furniture>): Observable<Furniture> {
    return this.httpService.post<Furniture>('furniture', furniture);
  }
}