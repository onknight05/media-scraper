import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions, LogLevel } from 'typeorm';
import { APP_CONFIG } from './app.config';

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: APP_CONFIG.DB_HOST,
  port: APP_CONFIG.DB_PORT,
  username: APP_CONFIG.DB_USER,
  password: APP_CONFIG.DB_PASSWORD,
  database: APP_CONFIG.DB_NAME,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: !APP_CONFIG.IS_PRODUCTION,
  logging: !APP_CONFIG.DB_LOGGING
    ? false
    : (APP_CONFIG.DB_LOGGING.split(',').map((level) => level.trim()) as LogLevel[]),
  extra: {
    max: APP_CONFIG.DB_POOL_SIZE,
  },
});

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: APP_CONFIG.DB_HOST,
  port: APP_CONFIG.DB_PORT,
  username: APP_CONFIG.DB_USER,
  password: APP_CONFIG.DB_PASSWORD,
  database: APP_CONFIG.DB_NAME,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
};

export default new DataSource(dataSourceOptions);
