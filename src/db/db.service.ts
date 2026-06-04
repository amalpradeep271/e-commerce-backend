import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  public db: NodePgDatabase<typeof schema>;
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const connectionString = this.configService.get<string>('DATABASE_URL');
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in the environment variables');
    }

    if (this.configService.get<string>('NODE_ENV') === 'development') {
      console.log('DrizzleService initializing pool with URL:', connectionString.substring(0, 50) + '...');
    } else {
      console.log('DrizzleService initializing pool...');
    }

    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 30000, // 30 seconds connection timeout for Neon cold-starts
      max: 3,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle pg client:', err.message);
    });

    this.db = drizzle({ client: this.pool, schema });

    // Keep-alive query every 4 minutes to prevent Neon serverless compute from auto-suspending
    setInterval(async () => {
      try {
        await this.pool.query('SELECT 1');
      } catch (err: any) {
        console.error('Database keep-alive ping failed:', err.message);
      }
    }, 4 * 60 * 1000);
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
