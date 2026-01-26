import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from '@config/database.config';
import { HealthModule } from '@modules/health/health.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: getDatabaseConfig,
    }),
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
