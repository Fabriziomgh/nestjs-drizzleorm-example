import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DrizzleDB } from './types/drizzle';
import { faker } from '@faker-js/faker';
import { Pool } from 'pg';
import * as schema from '../db/schema';

const COUNT = 200;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema }) as DrizzleDB;

async function main() {
  const usersToInsert = Array(COUNT)
    .fill(null)
    .map(() => ({
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
    }));

  try {
    await db.insert(schema.users).values(usersToInsert);
  } catch (error) {
    console.log(error);
  } finally {
    await pool.end();
  }
}

main().catch((error) => console.log(error));
