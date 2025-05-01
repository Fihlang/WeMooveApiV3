import {
  User,
  InsertUser,
  Driver,
  InsertDriver,
  Customer,
  InsertCustomer,
  Address, 
  InsertAddress,
  Package,
  InsertPackage,
  Delivery,
  InsertDelivery,
  Payment,
  InsertPayment,
  Review,
  InsertReview,
  Message,
  InsertMessage,
  Notification,
  InsertNotification,
  Furniture,
  InsertFurniture,
  DeliveryItem,
  InsertDeliveryItem,
  DeliveryWithDetails,
  DeliveryWithItems,
  DriverWithUser,
  DriverWithDetails,
} from "@shared/schema";

import { db } from "./db";
import { and, eq, gte, lte, desc, asc, sql } from "drizzle-orm";
import { users, drivers, customers, addresses, deliveries, packages, furniture, deliveryItems, payments, reviews, messages, notifications } from "@shared/schema";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Convert the callback-based scrypt to a Promise-based one
const scryptAsync = promisify(scrypt);

// Hash password using scrypt
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return `${derivedKey.toString("hex")}.${salt}`;
}

// PostgreSQL session store
const PostgresStore = connectPg(session);

// Interface for all storage operations
export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  
  // Customer operations
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomerByUserId(userId: number): Promise<Customer | undefined>;
  
  // Driver operations
  getDriver(id: number): Promise<Driver | undefined>;
  getDriverByUserId(userId: number): Promise<Driver | undefined>;
  getDriversNearby(latitude: number, longitude: number, radius: number): Promise<DriverWithUser[]>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver>;
  updateDriverLocation(id: number, latitude: number, longitude: number): Promise<Driver>;
  
  // Address operations
  createAddress(address: InsertAddress): Promise<Address>;
  getAddressesByUserId(userId: number): Promise<Address[]>;
  
  // Package operations
  createPackage(packageData: InsertPackage): Promise<Package>;
  getPackagesByDeliveryId(deliveryId: number): Promise<Package[]>;
  
  // Furniture operations
  getFurniture(id: number): Promise<Furniture | undefined>;
  getAllFurniture(): Promise<Furniture[]>;
  getFurnitureByCategory(category: string): Promise<Furniture[]>;
  createFurniture(furniture: InsertFurniture): Promise<Furniture>;
  
  // Delivery operations
  getDelivery(id: number): Promise<Delivery | undefined>;
  getDeliveryWithItems(id: number): Promise<DeliveryWithItems | undefined>;
  getDeliveryWithDetails(id: number): Promise<DeliveryWithDetails | undefined>;
  getDeliveriesByCustomerId(customerId: number): Promise<Delivery[]>;
  getDeliveriesByDriverId(driverId: number): Promise<Delivery[]>;
  getActiveDeliveriesByDriverId(driverId: number): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDeliveryStatus(id: number, status: string): Promise<Delivery>;
  assignDriverToDelivery(deliveryId: number, driverId: number): Promise<Delivery>;
  
  // Delivery Item operations
  createDeliveryItem(item: InsertDeliveryItem): Promise<DeliveryItem>;
  getDeliveryItemsByDeliveryId(deliveryId: number): Promise<DeliveryItem[]>;
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByDriverId(driverId: number): Promise<Review[]>;
  getReviewsByCustomerId(customerId: number): Promise<Review[]>;
  getAverageDriverRating(driverId: number): Promise<number>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentByDeliveryId(deliveryId: number): Promise<Payment | undefined>;
  updatePaymentStatus(id: number, status: string): Promise<Payment>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByDeliveryId(deliveryId: number): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<Message>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  getUnreadNotificationsByUserId(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification>;
}

// Memory storage implementation for local development
export class MemStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new session.MemoryStore();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    throw new Error("Method not implemented.");
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    throw new Error("Method not implemented.");
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    throw new Error("Method not implemented.");
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    throw new Error("Method not implemented.");
  }
  
  // Customer operations
  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    throw new Error("Method not implemented.");
  }
  
  async getCustomerByUserId(userId: number): Promise<Customer | undefined> {
    throw new Error("Method not implemented.");
  }
  
  // Driver operations
  async getDriver(id: number): Promise<Driver | undefined> {
    throw new Error("Method not implemented.");
  }
  
  async getDriverByUserId(userId: number): Promise<Driver | undefined> {
    throw new Error("Method not implemented.");
  }
  
  async getDriversNearby(latitude: number, longitude: number, radius: number): Promise<DriverWithUser[]> {
    throw new Error("Method not implemented.");
  }
  
  async createDriver(driverData: InsertDriver): Promise<Driver> {
    throw new Error("Method not implemented.");
  }
  
  async updateDriver(id: number, driverData: Partial<InsertDriver>): Promise<Driver> {
    throw new Error("Method not implemented.");
  }
  
  async updateDriverLocation(id: number, latitude: number, longitude: number): Promise<Driver> {
    throw new Error("Method not implemented.");
  }
  
  // Address operations
  async createAddress(addressData: InsertAddress): Promise<Address> {
    throw new Error("Method not implemented.");
  }
  
  async getAddressesByUserId(userId: number): Promise<Address[]> {
    throw new Error("Method not implemented.");
  }
  
  // Package operations
  async createPackage(packageData: InsertPackage): Promise<Package> {
    throw new Error("Method not implemented.");
  }
  
  async getPackagesByDeliveryId(deliveryId: number): Promise<Package[]> {
    throw new Error("Method not implemented.");
  }
  
  // Furniture operations
  async getFurniture(id: number): Promise<Furniture | undefined> {
    throw new Error("Method not implemented.");
  }
  
  async getAllFurniture(): Promise<Furniture[]> {
    throw new Error("Method not implemented.");
  }
  
  async getFurnitureByCategory(category: string): Promise<Furniture[]> {
    throw new Error("Method not implemented.");
  }
  
  async createFurniture(furnitureData: InsertFurniture): Promise<Furniture> {
    throw new Error("Method not implemented.");
  }
  
  // Delivery operations
  async getDelivery(id: number): Promise<Delivery | undefined> {
    throw new Error("Method not implemented.");
  }
  
  async getDeliveryWithItems(id: number): Promise<DeliveryWithItems | undefined> {
    throw new Error("Method not implemented.");
  }
  
  async getDeliveryWithDetails(id: number): Promise<DeliveryWithDetails | undefined> {
    throw new Error("Method not implemented.");
  }
  
  async getDeliveriesByCustomerId(customerId: number): Promise<Delivery[]> {
    throw new Error("Method not implemented.");
  }
  
  async getDeliveriesByDriverId(driverId: number): Promise<Delivery[]> {
    throw new Error("Method not implemented.");
  }
  
  async getActiveDeliveriesByDriverId(driverId: number): Promise<Delivery[]> {
    throw new Error("Method not implemented.");
  }
  
  async createDelivery(deliveryData: InsertDelivery): Promise<Delivery> {
    throw new Error("Method not implemented.");
  }
  
  async updateDeliveryStatus(id: number, status: string): Promise<Delivery> {
    throw new Error("Method not implemented.");
  }
  
  async assignDriverToDelivery(deliveryId: number, driverId: number): Promise<Delivery> {
    throw new Error("Method not implemented.");
  }
  
  // Delivery Item operations
  async createDeliveryItem(itemData: InsertDeliveryItem): Promise<DeliveryItem> {
    throw new Error("Method not implemented.");
  }
  
  async getDeliveryItemsByDeliveryId(deliveryId: number): Promise<DeliveryItem[]> {
    throw new Error("Method not implemented.");
  }
  
  // Review operations
  async createReview(reviewData: InsertReview): Promise<Review> {
    throw new Error("Method not implemented.");
  }
  
  async getReviewsByDriverId(driverId: number): Promise<Review[]> {
    throw new Error("Method not implemented.");
  }
  
  async getReviewsByCustomerId(customerId: number): Promise<Review[]> {
    throw new Error("Method not implemented.");
  }
  
  async getAverageDriverRating(driverId: number): Promise<number> {
    throw new Error("Method not implemented.");
  }
  
  // Payment operations
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    throw new Error("Method not implemented.");
  }
  
  async getPaymentByDeliveryId(deliveryId: number): Promise<Payment | undefined> {
    throw new Error("Method not implemented.");
  }
  
  async updatePaymentStatus(id: number, status: string): Promise<Payment> {
    throw new Error("Method not implemented.");
  }
  
  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    throw new Error("Method not implemented.");
  }
  
  async getMessagesByDeliveryId(deliveryId: number): Promise<Message[]> {
    throw new Error("Method not implemented.");
  }
  
  async markMessageAsRead(id: number): Promise<Message> {
    throw new Error("Method not implemented.");
  }
  
  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    throw new Error("Method not implemented.");
  }
  
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    throw new Error("Method not implemented.");
  }
  
  async getUnreadNotificationsByUserId(userId: number): Promise<Notification[]> {
    throw new Error("Method not implemented.");
  }
  
  async markNotificationAsRead(id: number): Promise<Notification> {
    throw new Error("Method not implemented.");
  }
}

// Database storage implementation with PostgreSQL
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  // Implement the rest of the storage interface methods...
  // These will be filled in as needed for specific functionality
  // For now we'll leave them as stubs
  
  // Customer operations
  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    throw new Error("Method not implemented.");
  }
  
  async getCustomerByUserId(userId: number): Promise<Customer | undefined> {
    throw new Error("Method not implemented.");
  }
  
  // Driver operations
  async getDriver(id: number): Promise<Driver | undefined> {
    throw new Error("Method not implemented.");
  }
  
  async getDriverByUserId(userId: number): Promise<Driver | undefined> {
    throw new Error("Method not implemented.");
  }
  
  async getDriversNearby(latitude: number, longitude: number, radius: number): Promise<DriverWithUser[]> {
    throw new Error("Method not implemented.");
  }
  
  async createDriver(driverData: InsertDriver): Promise<Driver> {
    throw new Error("Method not implemented.");
  }
  
  async updateDriver(id: number, driverData: Partial<InsertDriver>): Promise<Driver> {
    throw new Error("Method not implemented.");
  }
  
  async updateDriverLocation(id: number, latitude: number, longitude: number): Promise<Driver> {
    throw new Error("Method not implemented.");
  }
  
  // Address operations
  async createAddress(addressData: InsertAddress): Promise<Address> {
    throw new Error("Method not implemented.");
  }
  
  async getAddressesByUserId(userId: number): Promise<Address[]> {
    throw new Error("Method not implemented.");
  }
  
  // Package operations
  async createPackage(packageData: InsertPackage): Promise<Package> {
    throw new Error("Method not implemented.");
  }
  
  async getPackagesByDeliveryId(deliveryId: number): Promise<Package[]> {
    throw new Error("Method not implemented.");
  }
  
  // Furniture operations
  async getFurniture(id: number): Promise<Furniture | undefined> {
    throw new Error("Method not implemented.");
  }
  
  async getAllFurniture(): Promise<Furniture[]> {
    throw new Error("Method not implemented.");
  }
  
  async getFurnitureByCategory(category: string): Promise<Furniture[]> {
    throw new Error("Method not implemented.");
  }
  
  async createFurniture(furnitureData: InsertFurniture): Promise<Furniture> {
    throw new Error("Method not implemented.");
  }
  
  // Delivery operations
  async getDelivery(id: number): Promise<Delivery | undefined> {
    throw new Error("Method not implemented.");
  }
  
  async getDeliveryWithItems(id: number): Promise<DeliveryWithItems | undefined> {
    throw new Error("Method not implemented.");
  }
  
  async getDeliveryWithDetails(id: number): Promise<DeliveryWithDetails | undefined> {
    throw new Error("Method not implemented.");
  }
  
  async getDeliveriesByCustomerId(customerId: number): Promise<Delivery[]> {
    throw new Error("Method not implemented.");
  }
  
  async getDeliveriesByDriverId(driverId: number): Promise<Delivery[]> {
    throw new Error("Method not implemented.");
  }
  
  async getActiveDeliveriesByDriverId(driverId: number): Promise<Delivery[]> {
    throw new Error("Method not implemented.");
  }
  
  async createDelivery(deliveryData: InsertDelivery): Promise<Delivery> {
    throw new Error("Method not implemented.");
  }
  
  async updateDeliveryStatus(id: number, status: string): Promise<Delivery> {
    throw new Error("Method not implemented.");
  }
  
  async assignDriverToDelivery(deliveryId: number, driverId: number): Promise<Delivery> {
    throw new Error("Method not implemented.");
  }
  
  // Delivery Item operations
  async createDeliveryItem(itemData: InsertDeliveryItem): Promise<DeliveryItem> {
    throw new Error("Method not implemented.");
  }
  
  async getDeliveryItemsByDeliveryId(deliveryId: number): Promise<DeliveryItem[]> {
    throw new Error("Method not implemented.");
  }
  
  // Review operations
  async createReview(reviewData: InsertReview): Promise<Review> {
    throw new Error("Method not implemented.");
  }
  
  async getReviewsByDriverId(driverId: number): Promise<Review[]> {
    throw new Error("Method not implemented.");
  }
  
  async getReviewsByCustomerId(customerId: number): Promise<Review[]> {
    throw new Error("Method not implemented.");
  }
  
  async getAverageDriverRating(driverId: number): Promise<number> {
    throw new Error("Method not implemented.");
  }
  
  // Payment operations
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    throw new Error("Method not implemented.");
  }
  
  async getPaymentByDeliveryId(deliveryId: number): Promise<Payment | undefined> {
    throw new Error("Method not implemented.");
  }
  
  async updatePaymentStatus(id: number, status: string): Promise<Payment> {
    throw new Error("Method not implemented.");
  }
  
  // Message operations
  async createMessage(messageData: InsertMessage): Promise<Message> {
    throw new Error("Method not implemented.");
  }
  
  async getMessagesByDeliveryId(deliveryId: number): Promise<Message[]> {
    throw new Error("Method not implemented.");
  }
  
  async markMessageAsRead(id: number): Promise<Message> {
    throw new Error("Method not implemented.");
  }
  
  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    throw new Error("Method not implemented.");
  }
  
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    throw new Error("Method not implemented.");
  }
  
  async getUnreadNotificationsByUserId(userId: number): Promise<Notification[]> {
    throw new Error("Method not implemented.");
  }
  
  async markNotificationAsRead(id: number): Promise<Notification> {
    throw new Error("Method not implemented.");
  }
}

// Create a new instance of the storage
// Use database storage for production, memory storage for testing
export const storage = process.env.NODE_ENV === 'test' 
  ? new MemStorage() 
  : new DatabaseStorage();