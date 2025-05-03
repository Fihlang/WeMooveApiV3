import { User } from './user.model';
import { Address } from './address.model';

export enum ProfessionalSkill {
  MOVING = 'moving',
  ASSEMBLY = 'assembly',
  BOTH = 'both'
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum BookingType {
  MOVING = 'moving',
  ASSEMBLY = 'assembly'
}

export enum ServiceTier {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium'
}

export interface Professional {
  id: number;
  userId: number;
  user?: User;
  skills: ProfessionalSkill;
  experience: number;
  hourlyRate: number;
  bio: string;
  profileImageUrl: string | null;
  licensedAndInsured: boolean;
  serviceArea: string;
  backgroundChecked: boolean;
  rating: number;
  totalReviews: number;
  totalJobs: number;
  createdAt: Date;
  availabilityStartTime?: string;
  availabilityEndTime?: string;
  workDays?: string[];
}

export interface ProfessionalReview {
  id: number;
  customerId: number;
  customer?: {
    id: number;
    userId: number;
    user?: User;
  };
  professionalId: number;
  bookingId: number;
  rating: number;
  comment: string;
  serviceType: ProfessionalSkill;
  createdAt: Date;
}

export interface ProfessionalBooking {
  id: number;
  customerId: number;
  professionalId: number;
  professional?: Professional;
  bookingType: BookingType;
  serviceTier: ServiceTier;
  scheduledTime: Date;
  duration: number;
  addressId: number;
  address: Address;
  totalCost: number;
  itemsDescription: string;
  specialInstructions?: string;
  numberOfMovers?: number;
  hasHeavyItems?: boolean;
  hasStairs?: boolean;
  floorNumber?: number;
  status: BookingStatus;
  createdAt: Date;
  completedTime?: Date;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface AvailabilityDay {
  date: string;
  dayName: string;
  slots: TimeSlot[];
}

export interface BookingRequest {
  customerId: number;
  professionalId: number;
  bookingType: BookingType;
  serviceTier: ServiceTier;
  scheduledTime: string;
  duration: number;
  addressId: number;
  totalCost: number;
  itemsDescription: string;
  specialInstructions?: string;
  numberOfMovers?: number;
  hasHeavyItems?: boolean;
  hasStairs?: boolean;
  floorNumber?: number;
}