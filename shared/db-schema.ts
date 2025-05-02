import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  timestamp, 
  boolean, 
  integer, 
  decimal, 
  date,
  json,
  primaryKey,
  uniqueIndex 
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { 
  UserRole, 
  VehicleType, 
  DeliveryStatus, 
  PaymentStatus, 
  PaymentMethod,
  PackageType
} from './schema';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  address: varchar('address', { length: 255 }),
  city: varchar('city', { length: 100 }),
  province: varchar('province', { length: 100 }),
  zipCode: varchar('zip_code', { length: 20 }),
  role: varchar('role', { length: 20 }).notNull().default(UserRole.CUSTOMER),
  profilePicture: varchar('profile_picture', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
  isVerified: boolean('is_verified').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

// Drivers table
export const drivers = pgTable('drivers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  idNumber: varchar('id_number', { length: 13 }).notNull(),
  licenseNumber: varchar('license_number', { length: 50 }).notNull(),
  licenseExpiry: date('license_expiry').notNull(),
  vehicleType: varchar('vehicle_type', { length: 20 }).notNull(),
  vehicleMake: varchar('vehicle_make', { length: 100 }).notNull(),
  vehicleModel: varchar('vehicle_model', { length: 100 }).notNull(),
  vehicleYear: integer('vehicle_year').notNull(),
  vehicleColor: varchar('vehicle_color', { length: 50 }).notNull(),
  vehiclePlate: varchar('vehicle_plate', { length: 20 }).notNull(),
  licensePlate: varchar('license_plate', { length: 20 }).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 6 }),
  longitude: decimal('longitude', { precision: 10, scale: 6 }),
  heading: decimal('heading', { precision: 5, scale: 2 }),
  speed: decimal('speed', { precision: 5, scale: 2 }),
  lastLocationUpdate: timestamp('last_location_update'),
  isAvailable: boolean('is_available').default(true).notNull(),
  isOnline: boolean('is_online').default(false).notNull(),
  currentDeliveryId: integer('current_delivery_id'),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0').notNull(),
  ratingCount: integer('rating_count').default(0).notNull(),
  verificationStatus: varchar('verification_status', { length: 20 }).default('pending').notNull(),
  insuranceInfo: varchar('insurance_info', { length: 255 }),
  backgroundCheckStatus: varchar('background_check_status', { length: 20 }).default('pending').notNull(),
  maxCapacity: decimal('max_capacity', { precision: 6, scale: 2 }),
  maxWeight: decimal('max_weight', { precision: 6, scale: 2 }),
  supportsFurniture: boolean('supports_furniture').default(false),
  supportsParcel: boolean('supports_parcel').default(false),
});

// Customers table
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  defaultAddressId: integer('default_address_id'),
  preferredPaymentMethod: varchar('preferred_payment_method', { length: 20 }),
});

// Addresses table
export const addresses = pgTable('addresses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  province: varchar('province', { length: 100 }).notNull(),
  zipCode: varchar('zip_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 100 }).default('South Africa').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 6 }),
  longitude: decimal('longitude', { precision: 10, scale: 6 }),
  isDefault: boolean('is_default').default(false).notNull(),
  label: varchar('label', { length: 50 }),
});

// Deliveries table
export const deliveries = pgTable('deliveries', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  driverId: integer('driver_id').references(() => drivers.id),
  pickupAddressId: integer('pickup_address_id').notNull().references(() => addresses.id),
  dropoffAddressId: integer('dropoff_address_id').notNull().references(() => addresses.id),
  status: varchar('status', { length: 30 }).default(DeliveryStatus.PENDING).notNull(),
  scheduledPickupTime: timestamp('scheduled_pickup_time'),
  actualPickupTime: timestamp('actual_pickup_time'),
  estimatedDeliveryTime: timestamp('estimated_delivery_time'),
  actualDeliveryTime: timestamp('actual_delivery_time'),
  distance: decimal('distance', { precision: 10, scale: 2 }),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  requiredVehicleType: varchar('required_vehicle_type', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

// Packages table
export const packages = pgTable('packages', {
  id: serial('id').primaryKey(),
  deliveryId: integer('delivery_id').notNull().references(() => deliveries.id),
  packageType: varchar('package_type', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  weight: decimal('weight', { precision: 10, scale: 2 }),
  length: decimal('length', { precision: 10, scale: 2 }),
  width: decimal('width', { precision: 10, scale: 2 }),
  height: decimal('height', { precision: 10, scale: 2 }),
  isFragile: boolean('is_fragile').default(false).notNull(),
  requiresSpecialHandling: boolean('requires_special_handling').default(false).notNull(),
  photoUrl: varchar('photo_url', { length: 255 }),
});

// Payments table
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  deliveryId: integer('delivery_id').notNull().references(() => deliveries.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default(PaymentStatus.PENDING).notNull(),
  method: varchar('method', { length: 20 }).notNull(),
  transactionId: varchar('transaction_id', { length: 100 }),
  paymentDate: timestamp('payment_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Reviews table
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  deliveryId: integer('delivery_id').notNull().references(() => deliveries.id),
  reviewerId: integer('reviewer_id').notNull().references(() => users.id),
  revieweeId: integer('reviewee_id').notNull().references(() => users.id),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Messages table
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  deliveryId: integer('delivery_id').notNull().references(() => deliveries.id),
  senderId: integer('sender_id').notNull().references(() => users.id),
  receiverId: integer('receiver_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  title: varchar('title', { length: 100 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  referenceId: integer('reference_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Furniture items table for compatibility with existing code
export const furniture = pgTable('furniture', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar('image_url', { length: 255 }),
  width: decimal('width', { precision: 10, scale: 2 }),
  height: decimal('height', { precision: 10, scale: 2 }),
  depth: decimal('depth', { precision: 10, scale: 2 }),
  weight: decimal('weight', { precision: 10, scale: 2 }),
  isAvailable: boolean('is_available').default(true).notNull(),
  requiresAssembly: boolean('requires_assembly').default(false).notNull(),
});

// Delivery items table for compatibility with existing code
export const deliveryItems = pgTable('delivery_items', {
  id: serial('id').primaryKey(),
  deliveryId: integer('delivery_id').notNull().references(() => deliveries.id),
  furnitureId: integer('furniture_id').notNull().references(() => furniture.id),
  quantity: integer('quantity').notNull().default(1),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
});

// Zod schemas for inserting data
export const insertUserSchema = createInsertSchema(users, {
  role: z.enum([UserRole.CUSTOMER, UserRole.DRIVER, UserRole.ADMIN]),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertDriverSchema = createInsertSchema(drivers, {
  vehicleType: z.enum([VehicleType.TRUCK, VehicleType.VAN, VehicleType.MOTORBIKE]),
}).omit({ id: true });

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true });

export const insertAddressSchema = createInsertSchema(addresses).omit({ id: true });

export const insertDeliverySchema = createInsertSchema(deliveries, {
  status: z.enum([
    DeliveryStatus.PENDING,
    DeliveryStatus.ACCEPTED,
    DeliveryStatus.DRIVER_EN_ROUTE_TO_PICKUP,
    DeliveryStatus.AT_PICKUP,
    DeliveryStatus.LOADING,
    DeliveryStatus.IN_TRANSIT,
    DeliveryStatus.ARRIVING,
    DeliveryStatus.AT_DROPOFF,
    DeliveryStatus.UNLOADING,
    DeliveryStatus.COMPLETED,
    DeliveryStatus.CANCELLED
  ]),
  requiredVehicleType: z.enum([VehicleType.TRUCK, VehicleType.VAN, VehicleType.MOTORBIKE]),
}).omit({ 
  id: true, 
  actualPickupTime: true, 
  actualDeliveryTime: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertPackageSchema = createInsertSchema(packages, {
  packageType: z.enum([
    PackageType.FURNITURE, 
    PackageType.PARCEL, 
    PackageType.DOCUMENT, 
    PackageType.FRAGILE, 
    PackageType.ELECTRONICS, 
    PackageType.OTHER
  ]),
}).omit({ id: true });

export const insertPaymentSchema = createInsertSchema(payments, {
  status: z.enum([
    PaymentStatus.PENDING,
    PaymentStatus.PAID,
    PaymentStatus.FAILED,
    PaymentStatus.REFUNDED
  ]),
  method: z.enum([
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.CASH,
    PaymentMethod.MOBILE_PAYMENT
  ]),
}).omit({ id: true, paymentDate: true, createdAt: true });

export const insertReviewSchema = createInsertSchema(reviews, {
  rating: z.number().min(1).max(5),
}).omit({ id: true, createdAt: true });

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, isRead: true, createdAt: true });

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, isRead: true, createdAt: true });

export const insertFurnitureSchema = createInsertSchema(furniture).omit({ id: true });

export const insertDeliveryItemSchema = createInsertSchema(deliveryItems).omit({ id: true });

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = z.infer<typeof insertAddressSchema>;

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;

export type Package = typeof packages.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Furniture = typeof furniture.$inferSelect;
export type InsertFurniture = z.infer<typeof insertFurnitureSchema>;

export type DeliveryItem = typeof deliveryItems.$inferSelect;
export type InsertDeliveryItem = z.infer<typeof insertDeliveryItemSchema>;

// Extended types
export type DriverWithUser = Driver & { user: User };
export type DeliveryWithDetails = Delivery & { 
  customer: User, 
  driver?: Driver & { user: User }, 
  packages: Package[],
  pickupAddress: Address,
  dropoffAddress: Address,
  payment?: Payment
};