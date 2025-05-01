import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../shared/db-schema';

// Check for database URL
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create postgres connection
const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });

// Create a drizzle instance
const db = drizzle(migrationClient, { schema });

// Main function to run migrations
async function main() {
  try {
    console.log('Pushing schema to database...');
    
    // Drop all tables when in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: dropping all tables...');
      
      // Drop tables in correct order (considering foreign key constraints)
      const tables = [
        'delivery_items', 'reviews', 'messages', 'notifications', 
        'payments', 'packages', 'deliveries', 'addresses', 
        'drivers', 'customers', 'furniture', 'users'
      ];
      
      for (const table of tables) {
        try {
          await migrationClient.unsafe(`DROP TABLE IF EXISTS ${table} CASCADE`);
          console.log(`Dropped table: ${table}`);
        } catch (err) {
          console.error(`Error dropping table ${table}:`, err);
        }
      }
    }
    
    // Create tables based on schema
    console.log('Creating tables...');
    const queries = [
      // Users
      migrationClient.unsafe(
        `CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          address VARCHAR(255),
          city VARCHAR(100),
          province VARCHAR(100),
          zip_code VARCHAR(20),
          role VARCHAR(20) NOT NULL DEFAULT 'customer',
          profile_picture VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP,
          is_verified BOOLEAN DEFAULT FALSE NOT NULL,
          is_active BOOLEAN DEFAULT TRUE NOT NULL
        )`
      ),
      
      // Drivers
      migrationClient.unsafe(
        `CREATE TABLE IF NOT EXISTS drivers (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          id_number VARCHAR(13) NOT NULL,
          license_number VARCHAR(50) NOT NULL,
          license_expiry DATE NOT NULL,
          vehicle_type VARCHAR(20) NOT NULL,
          vehicle_make VARCHAR(100) NOT NULL,
          vehicle_model VARCHAR(100) NOT NULL,
          vehicle_year INTEGER NOT NULL,
          vehicle_color VARCHAR(50) NOT NULL,
          vehicle_plate VARCHAR(20) NOT NULL,
          latitude DECIMAL(10,6),
          longitude DECIMAL(10,6),
          is_available BOOLEAN DEFAULT TRUE NOT NULL,
          rating DECIMAL(3,2) DEFAULT 0 NOT NULL,
          rating_count INTEGER DEFAULT 0 NOT NULL,
          verification_status VARCHAR(20) DEFAULT 'pending' NOT NULL,
          insurance_info VARCHAR(255),
          background_check_status VARCHAR(20) DEFAULT 'pending' NOT NULL
        )`
      ),
      
      // Customers
      migrationClient.unsafe(
        `CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          default_address_id INTEGER,
          preferred_payment_method VARCHAR(20)
        )`
      ),
      
      // Addresses
      migrationClient.unsafe(
        `CREATE TABLE IF NOT EXISTS addresses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          address_line1 VARCHAR(255) NOT NULL,
          address_line2 VARCHAR(255),
          city VARCHAR(100) NOT NULL,
          province VARCHAR(100) NOT NULL,
          zip_code VARCHAR(20) NOT NULL,
          country VARCHAR(100) DEFAULT 'South Africa' NOT NULL,
          latitude DECIMAL(10,6),
          longitude DECIMAL(10,6),
          is_default BOOLEAN DEFAULT FALSE NOT NULL,
          label VARCHAR(50)
        )`
      ),
      
      // Update customers to reference addresses
      migrationClient.unsafe(
        `ALTER TABLE customers
         ADD CONSTRAINT fk_default_address
         FOREIGN KEY (default_address_id) 
         REFERENCES addresses(id)`
      ),
      
      // Deliveries
      migrationClient.unsafe(
        `CREATE TABLE IF NOT EXISTS deliveries (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER NOT NULL REFERENCES customers(id),
          driver_id INTEGER REFERENCES drivers(id),
          pickup_address_id INTEGER NOT NULL REFERENCES addresses(id),
          dropoff_address_id INTEGER NOT NULL REFERENCES addresses(id),
          status VARCHAR(30) DEFAULT 'pending' NOT NULL,
          scheduled_pickup_time TIMESTAMP,
          actual_pickup_time TIMESTAMP,
          estimated_delivery_time TIMESTAMP,
          actual_delivery_time TIMESTAMP,
          distance DECIMAL(10,2),
          price DECIMAL(10,2) NOT NULL,
          notes TEXT,
          required_vehicle_type VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP
        )`
      ),
      
      // Packages
      migrationClient.unsafe(
        `CREATE TABLE IF NOT EXISTS packages (
          id SERIAL PRIMARY KEY,
          delivery_id INTEGER NOT NULL REFERENCES deliveries(id),
          package_type VARCHAR(20) NOT NULL,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          weight DECIMAL(10,2),
          length DECIMAL(10,2),
          width DECIMAL(10,2),
          height DECIMAL(10,2),
          is_fragile BOOLEAN DEFAULT FALSE NOT NULL,
          requires_special_handling BOOLEAN DEFAULT FALSE NOT NULL,
          photo_url VARCHAR(255)
        )`
      ),
      
      // Payments
      migrationClient.unsafe(
        `CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          delivery_id INTEGER NOT NULL REFERENCES deliveries(id),
          amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(20) DEFAULT 'pending' NOT NULL,
          method VARCHAR(20) NOT NULL,
          transaction_id VARCHAR(100),
          payment_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )`
      ),
      
      // Reviews
      migrationClient.unsafe(
        `CREATE TABLE IF NOT EXISTS reviews (
          id SERIAL PRIMARY KEY,
          delivery_id INTEGER NOT NULL REFERENCES deliveries(id),
          reviewer_id INTEGER NOT NULL REFERENCES users(id),
          reviewee_id INTEGER NOT NULL REFERENCES users(id),
          rating INTEGER NOT NULL,
          comment TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )`
      ),
      
      // Messages
      migrationClient.unsafe(
        `CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          delivery_id INTEGER NOT NULL REFERENCES deliveries(id),
          sender_id INTEGER NOT NULL REFERENCES users(id),
          receiver_id INTEGER NOT NULL REFERENCES users(id),
          content TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )`
      ),
      
      // Notifications
      migrationClient.unsafe(
        `CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          title VARCHAR(100) NOT NULL,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE NOT NULL,
          type VARCHAR(50) NOT NULL,
          reference_id INTEGER,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )`
      ),
      
      // Furniture
      migrationClient.unsafe(
        `CREATE TABLE IF NOT EXISTS furniture (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          category VARCHAR(50) NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          image_url VARCHAR(255),
          width DECIMAL(10,2),
          height DECIMAL(10,2),
          depth DECIMAL(10,2),
          weight DECIMAL(10,2),
          is_available BOOLEAN DEFAULT TRUE NOT NULL,
          requires_assembly BOOLEAN DEFAULT FALSE NOT NULL
        )`
      ),
      
      // Delivery Items
      migrationClient.unsafe(
        `CREATE TABLE IF NOT EXISTS delivery_items (
          id SERIAL PRIMARY KEY,
          delivery_id INTEGER NOT NULL REFERENCES deliveries(id),
          furniture_id INTEGER NOT NULL REFERENCES furniture(id),
          quantity INTEGER DEFAULT 1 NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          notes TEXT
        )`
      ),
    ];
    
    // Execute all queries in sequence
    for (const query of queries) {
      await query;
    }
    
    console.log('Schema successfully pushed to database!');
  } catch (error) {
    console.error('Error pushing schema to database:', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
    process.exit(0);
  }
}

main();