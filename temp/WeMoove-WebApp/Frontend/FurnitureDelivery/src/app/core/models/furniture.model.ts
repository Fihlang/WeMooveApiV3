export interface Furniture {
  id: number;
  name: string;
  description?: string;
  weight: number; // in kg
  dimensions: {
    length: number;
    width: number;
    height: number;
  }; // in cm
  category: string; // sofa, table, chair, etc.
  imageUrl?: string;
}

export interface FurnitureCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}