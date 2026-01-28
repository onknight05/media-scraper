import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly register: client.Registry;

  // HTTP metrics
  readonly httpRequestDuration: client.Histogram;
  readonly httpRequestTotal: client.Counter;

  // Queue metrics
  readonly jobProcessingDuration: client.Histogram;
  readonly jobTotal: client.Counter;
  readonly jobMediaExtracted: client.Histogram;

  // Scraping strategy metrics
  readonly scrapeFetchStrategyTotal: client.Counter;
  readonly scrapeFetchDuration: client.Histogram;

  constructor() {
    this.register = new client.Registry();

    // Collect default Node.js metrics (memory, event loop, GC, etc.)
    client.collectDefaultMetrics({ register: this.register });

    // --- HTTP metrics ---
    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'] as const,
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register],
    });

    this.httpRequestTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'] as const,
      registers: [this.register],
    });

    // --- Queue / Job metrics ---
    this.jobProcessingDuration = new client.Histogram({
      name: 'scraper_job_duration_seconds',
      help: 'Duration of scraper job processing in seconds',
      labelNames: ['status'] as const,
      buckets: [0.5, 1, 2.5, 5, 10, 30, 60, 120],
      registers: [this.register],
    });

    this.jobTotal = new client.Counter({
      name: 'scraper_jobs_total',
      help: 'Total number of scraper jobs processed',
      labelNames: ['status'] as const,
      registers: [this.register],
    });

    this.jobMediaExtracted = new client.Histogram({
      name: 'scraper_job_media_extracted',
      help: 'Number of media items extracted per job',
      buckets: [0, 1, 5, 10, 25, 50, 100, 250, 500],
      registers: [this.register],
    });

    // --- Scraping strategy metrics ---
    this.scrapeFetchStrategyTotal = new client.Counter({
      name: 'scraper_fetch_strategy_total',
      help: 'Total scrape attempts by fetch strategy',
      labelNames: ['strategy', 'outcome'] as const,
      registers: [this.register],
    });

    this.scrapeFetchDuration = new client.Histogram({
      name: 'scraper_fetch_duration_seconds',
      help: 'Duration of content fetching by strategy',
      labelNames: ['strategy'] as const,
      buckets: [0.1, 0.5, 1, 2.5, 5, 10, 30],
      registers: [this.register],
    });
  }

  onModuleInit() {
    // Register singleton so non-injectable code (e.g., scraper utils) can access metrics
    const { setMetricsService } = require('./metrics.singleton');
    setMetricsService(this);
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  getContentType(): string {
    return this.register.contentType;
  }
}
