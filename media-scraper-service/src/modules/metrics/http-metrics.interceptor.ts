import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { FastifyRequest, FastifyReply } from 'fastify';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<FastifyRequest>();
    const method = request.method;

    // Use the route pattern (e.g. /api/scraper/media/:id) instead of the actual URL
    const route = request.routeOptions?.url || request.url;

    const timer = this.metricsService.httpRequestDuration.startTimer({
      method,
      route,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const response = httpCtx.getResponse<FastifyReply>();
          const statusCode = String(response.statusCode);
          timer({ status_code: statusCode });
          this.metricsService.httpRequestTotal.inc({
            method,
            route,
            status_code: statusCode,
          });
        },
        error: () => {
          // On error, NestJS exception filters set the status before sending.
          // We record it as 500 here; the filter handles the actual response.
          const response = httpCtx.getResponse<FastifyReply>();
          const statusCode = String(response.statusCode || 500);
          timer({ status_code: statusCode });
          this.metricsService.httpRequestTotal.inc({
            method,
            route,
            status_code: statusCode,
          });
        },
      }),
    );
  }
}
