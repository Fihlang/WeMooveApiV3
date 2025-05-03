import { User } from './user.model';

/**
 * Skill categories for professionals
 */
export enum ProfessionalSkill {
  MOVING = 'moving',
  ASSEMBLY = 'assembly',
  BOTH = 'both'
}

/**
 * Represents a professional mover or assembler
 */
export interface Professional {
  id: number;
  userId: number;
  user?: User;
  skills: ProfessionalSkill;
  hourlyRate: number;
  yearsOfExperience: number;
  biography: string;
  certifications: string[];
  specialties: string[];
  isAvailable: boolean;
  isVerified: boolean;
  rating: number;
  totalJobs: number;
  completedJobs: number;
  currentLatitude?: number;
  currentLongitude?: number;
  profileImageUrl?: string;
}

/**
 * Represents a professional with review details for display
 */
export interface ProfessionalWithReviews extends Professional {
  recentReviews: ProfessionalReview[];
}

/**
 * Represents a review for a professional
 */
export interface ProfessionalReview {
  id: number;
  professionalId: number;
  customerId: number;
  customer?: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  bookingId: number;
  rating: number;
  comment: string;
  createdAt: Date;
  serviceType: ProfessionalSkill;
}

/**
 * Type of booking for a professional
 */
export enum BookingType {
  MOVING = 'moving',
  ASSEMBLY = 'assembly'
}

/**
 * Status of a professional booking
 */
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Represents a booking for a professional service
 */
export interface ProfessionalBooking {
  id: number;
  professionalId: number;
  professional?: Professional;
  customerId: number;
  customer?: User;
  deliveryId?: number;
  bookingType: BookingType;
  status: BookingStatus;
  scheduledTime: Date;
  completedTime?: Date;
  duration: number; // In hours
  totalCost: number;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    province: string;
    zipCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  itemsDescription: string;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}