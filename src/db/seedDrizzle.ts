import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DrizzleDB } from './types/drizzle';
import { Pool } from 'pg';
import { seed } from 'drizzle-seed';
import * as schema from '../db/schema';

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema }) as DrizzleDB;

  try {
    await seed(db, schema, { count: 200 });
  } catch (err) {
    console.log(err);
  } finally {
    await pool.end();
  }
}

main().catch((err) => console.log(err));
