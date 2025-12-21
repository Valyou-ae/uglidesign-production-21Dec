import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure Neon for better connection handling
neonConfig.fetchConnectionCache = true;

// Use Neon serverless driver for better cloud database connectivity
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Connection pool for session store and direct queries
// Sized for production concurrent user load
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '20'),  // Default 20 connections for production
  min: parseInt(process.env.DB_POOL_MIN || '2'),   // Keep minimum connections warm
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  ssl: { rejectUnauthorized: false },
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
});
