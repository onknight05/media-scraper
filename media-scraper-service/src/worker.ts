import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { WorkerModule } from "./worker.module";
import { APP_CONFIG } from "./config/app.config";

const WORKER_METRICS_PORT = 3010;

async function bootstrapWorker() {
  const logger = new Logger('Worker');

  // Create a Fastify app to expose metrics endpoint
  const app = await NestFactory.create<NestFastifyApplication>(
    WorkerModule,
    new FastifyAdapter(),
    { logger: false }
  );

  // Only expose the metrics endpoint
  app.setGlobalPrefix('api');

  await app.listen(WORKER_METRICS_PORT, '0.0.0.0');

  logger.debug(`Worker module initialized. SCRAPER_CONCURRENCY: ${APP_CONFIG.SCRAPER_CONCURRENCY}`);
  logger.log('Worker is running and listening for jobs...');
  logger.log(`Worker metrics available at: http://0.0.0.0:${WORKER_METRICS_PORT}/api/metrics`);
}

bootstrapWorker();