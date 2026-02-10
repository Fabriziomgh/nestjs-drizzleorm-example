import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { Pool } from 'pg';
import { DrizzleDB } from 'src/db/types/drizzle';

export const PG_CONNECTION = 'PG_CONNECTION';

@Module({
  providers: [
    {
      provide: PG_CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const connection = config.get<string>('DATABASE_URL');
        const pool = new Pool({
          connectionString: connection,
        });
        return drizzle(pool, { schema }) as DrizzleDB;
      },
    },
  ],
  exports: [PG_CONNECTION],
})
export class DrizzleModule {}
