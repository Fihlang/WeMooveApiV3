export interface Driver {
  id: number;
  userId: number;
  vehicleType: string;
  licensePlate: string;
  capacity: string;
  isAvailable: boolean;
  rating: number | null;
  currentLatitude: number | null;
  currentLongitude: number | null;
  verificationStatus: string;
  documents: any;
}

export interface DriverWithDetails extends Driver {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    avatarUrl: string | null;
  };
  currentDeliveries?: any[];
  averageRating?: number;
}