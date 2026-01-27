import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { WorkerModule } from "./worker.module";

async function bootstrapWorker() {
  const logger = new Logger('Worker');
  await NestFactory.createApplicationContext(WorkerModule);
  logger.log('Worker is running');
}

bootstrapWorker();