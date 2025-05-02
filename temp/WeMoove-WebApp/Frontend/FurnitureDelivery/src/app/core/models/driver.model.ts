import { User } from './user.model';

export interface Driver {
  id: number;
  userId: number;
  user?: User;
  vehicleType: string;
  licensePlate: string;
  capacity: 'Small' | 'Medium' | 'Large';
  isAvailable: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  rating: number;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  documents?: {
    license?: string;
    insurance?: string;
    [key: string]: string | undefined;
  };
}

export interface DriverLocation {
  driverId: number;
  latitude: number;
  longitude: number;
  lastUpdated: Date;
}

export interface DriverWithDetails extends Driver {
  user: User;
  reviewCount: number;
  averageRating: number;
}