/**
 * Represents a delivery address
 */
export interface Address {
  id: number;
  userId: number;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  label?: string;
}

/**
 * Payload for creating a new address
 */
export interface CreateAddressRequest {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province: string;
  zipCode: string;
  country?: string;
  label?: string;
  isDefault?: boolean;
}