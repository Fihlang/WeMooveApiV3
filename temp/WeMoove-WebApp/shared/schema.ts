// Re-export everything from db-schema.ts
export * from './db-schema';

// Define constants
export const UserRole = {
  CUSTOMER: "customer",
  DRIVER: "driver",
  ADMIN: "admin",
} as const;

export const VehicleType = {
  TRUCK: "truck",
  VAN: "van",
  MOTORBIKE: "motorbike",
} as const;

export const DriverStatus = {
  OFFLINE: "offline",
  ONLINE: "online",
  BUSY: "busy",
  ON_BREAK: "on_break",
} as const;

export const DeliveryStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DRIVER_EN_ROUTE_TO_PICKUP: "driver_en_route_to_pickup",
  AT_PICKUP: "at_pickup",
  LOADING: "loading",
  IN_TRANSIT: "in_transit",
  ARRIVING: "arriving",
  AT_DROPOFF: "at_dropoff",
  UNLOADING: "unloading",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const PaymentStatus = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export const PaymentMethod = {
  CREDIT_CARD: "credit_card",
  DEBIT_CARD: "debit_card",
  BANK_TRANSFER: "bank_transfer",
  CASH: "cash",
  MOBILE_PAYMENT: "mobile_payment",
} as const;

export const PackageType = {
  FURNITURE: "furniture",
  PARCEL: "parcel",
  DOCUMENT: "document",
  FRAGILE: "fragile",
  ELECTRONICS: "electronics",
  OTHER: "other",
} as const;

// Define additional types
export type DeliveryWithItems = Delivery & {
  items: DeliveryItem[];
  customer?: Customer & { user: User };
  driver?: Driver & { user: User };
  pickupAddress?: Address;
  dropoffAddress?: Address;
};

export type DriverWithDetails = Driver & {
  user: User;
  ratings?: Review[];
  avgRating?: number;
};