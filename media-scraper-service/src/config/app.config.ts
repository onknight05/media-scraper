import * as dotenv from 'dotenv';

dotenv.config();

export const APP_CONFIG = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',

  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_NAME: process.env.DB_NAME || 'media_scraper',
  DB_LOGGING: process.env.DB_LOGGING || 'error,warn',
  DB_POOL_SIZE: parseInt(process.env.DB_POOL_SIZE || '20', 10),

  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),

  SCRAPER_CONCURRENCY: parseInt(process.env.SCRAPER_CONCURRENCY || '20', 10),
} as const;
