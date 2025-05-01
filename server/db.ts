import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/db-schema';
import { Pool } from 'pg';

// Check for the database URL
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

// Create a postgres connection for Drizzle ORM
const queryClient = postgres(process.env.DATABASE_URL);

// Create a pg Pool for session storage
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// Create a drizzle client
export const db = drizzle(queryClient, { schema });

// Helper function to close the database connection
export const closeDbConnection = async () => {
  await queryClient.end();
  await pool.end();
};