export interface Furniture {
  id: number;
  name: string;
  description: string | null;
  weight: number;
  dimensions: any; // JSON object with width, height, depth
  category: string;
  imageUrl: string | null;
}

export interface FurnitureCategory {
  id: string;
  name: string;
  description: string | null;
}