/**
 * Represents a package for parcel delivery
 */
export interface Package {
  id: number;
  deliveryId: number;
  packageType: 'furniture' | 'parcel' | 'document' | 'fragile' | 'electronics' | 'other';
  name: string;
  description?: string;
  weight?: number; // in kg
  length?: number; // in cm
  width?: number;  // in cm
  height?: number; // in cm
  isFragile: boolean;
  requiresSpecialHandling: boolean;
  photoUrl?: string;
}

/**
 * Package types available for delivery
 */
export const PackageTypes = {
  FURNITURE: 'furniture',
  PARCEL: 'parcel',
  DOCUMENT: 'document',
  FRAGILE: 'fragile',
  ELECTRONICS: 'electronics',
  OTHER: 'other'
} as const;

/**
 * Payload for creating a new package
 */
export interface CreatePackageRequest {
  type: string;
  name: string;
  description?: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  isFragile?: boolean;
  requiresSpecialHandling?: boolean;
  photoUrl?: string;
}