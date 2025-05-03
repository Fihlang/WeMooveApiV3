/**
 * Options for furniture delivery services
 */
export interface FurnitureDeliveryOptions {
  requiresMovingAssistance: boolean; // If true, drivers will help move furniture into the location
  requiresAssembly: boolean; // If true, drivers will help assemble furniture
  numberOfMovers: number; // Number of movers needed (1-4)
  numberOfHeavyItems: number; // Number of items requiring 2+ people to move
  hasStairs: boolean; // If true, delivery location has stairs
  floorNumber: number; // Floor number for delivery (0 = ground floor)
  hasElevator: boolean; // If true, building has elevator access
  specialInstructions?: string; // Any special instructions for moving/assembly
}

/**
 * Pricing tiers for additional services
 */
export enum ServiceTier {
  BASIC = 'basic',      // Delivery only, no extra services
  STANDARD = 'standard', // Includes basic moving assistance
  PREMIUM = 'premium'   // Includes moving assistance and assembly
}

/**
 * Service pricing configuration
 */
export const SERVICE_PRICING = {
  [ServiceTier.BASIC]: {
    basePrice: 50,
    movingAssistance: 0,
    assembly: 0
  },
  [ServiceTier.STANDARD]: {
    basePrice: 80,
    movingAssistance: 30,
    assembly: 0
  },
  [ServiceTier.PREMIUM]: {
    basePrice: 120,
    movingAssistance: 30,
    assembly: 40
  },
  additionalFees: {
    perHeavyItem: 15,
    perFloor: 10, // Only applies if no elevator and floor > 0
    extraMover: 25 // Fee per additional mover beyond the first two
  }
};