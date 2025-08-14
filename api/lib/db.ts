
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema.js';

// Check for the environment variable and throw an error if it's not set.
if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

// Use this to run transactions
const sql = neon(process.env.POSTGRES_URL!);
export const db = drizzle(sql, { schema });