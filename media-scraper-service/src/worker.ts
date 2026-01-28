import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { WorkerModule } from "./worker.module";
import { APP_CONFIG } from "./config/app.config";

async function bootstrapWorker() {
  const logger = new Logger('Worker');
  await NestFactory.createApplicationContext(WorkerModule);
  logger.debug(`Worker module initialized. SCRAPER_CONCURRENCY: ${APP_CONFIG.SCRAPER_CONCURRENCY}`);
  logger.log('Worker is running and listening for jobs...');
}

bootstrapWorker();