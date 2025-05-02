export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  userType: 'customer' | 'driver' | 'admin';
  createdAt: Date;
}