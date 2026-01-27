import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from '@config/database.config';
import { HealthModule } from '@modules/health/health.module';
import { ScraperModule } from '@modules/scraper/scraper.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: getDatabaseConfig,
    }),
    HealthModule,
    ScraperModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
