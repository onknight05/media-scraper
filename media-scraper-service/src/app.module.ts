import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { getDatabaseConfig } from '@config/database.config';
import { APP_CONFIG } from '@config/app.config';
import { HealthModule } from '@modules/health/health.module';
import { ScraperModule } from '@modules/scraper/scraper.module';
import { MetricsModule } from '@modules/metrics/metrics.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: getDatabaseConfig,
    }),
    BullModule.forRoot({
      connection: {
        host: APP_CONFIG.REDIS_HOST,
        port: APP_CONFIG.REDIS_PORT,
      },
      defaultJobOptions: {
        removeOnComplete: { count: 5000 },
        removeOnFail: { count: 5000 },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    }),
    MetricsModule,
    HealthModule,
    ScraperModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
