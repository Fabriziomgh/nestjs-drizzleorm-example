import * as schema from 'src/db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export type DrizzleDB = NodePgDatabase<typeof schema>;
