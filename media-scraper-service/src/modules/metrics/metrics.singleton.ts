import { MetricsService } from './metrics.service';

/**
 * Provides access to MetricsService from non-injectable contexts (e.g., utility functions).
 * Set once during module initialization; safe to call getMetricsService() after bootstrap.
 */
let metricsServiceInstance: MetricsService | null = null;

export function setMetricsService(service: MetricsService): void {
  metricsServiceInstance = service;
}

export function getMetricsService(): MetricsService | null {
  return metricsServiceInstance;
}
