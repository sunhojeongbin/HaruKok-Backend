// src/common/interceptors/simple-metrics.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService } from '../services/metrics.service';

@Injectable()
export class SimpleMetricsInterceptor implements NestInterceptor {
    constructor(private readonly metricsService: MetricsService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const now = Date.now();
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();

        const { method, url, ip } = request;
        const userAgent = request.get('User-Agent') || '';

        // 모니터링 경로는 메트릭 수집에서 제외
        const isMonitoringPath = url.startsWith('/monitoring');

        if (isMonitoringPath) {
            console.log(`🚫 SimpleMetricsInterceptor: Skipping monitoring path ${method} ${url}`);
            return next.handle();
        }

        console.log(`🚀 SimpleMetricsInterceptor: Starting ${method} ${url}`);

        return next.handle().pipe(
            tap({
                complete: () => {
                    const executionTime = Date.now() - now;
                    const statusCode = response.statusCode || 200;

                    console.log(
                        `✅ SimpleMetricsInterceptor: Completed ${method} ${url} - ${statusCode} - ${executionTime}ms`,
                    );

                    // 메트릭 기록
                    this.metricsService.recordApiCall({
                        method,
                        url,
                        statusCode,
                        responseTime: executionTime,
                        timestamp: new Date(),
                        ip,
                        userAgent,
                    });
                },
                error: (error) => {
                    const executionTime = Date.now() - now;
                    const statusCode = error.status || 500;

                    console.log(
                        `❌ SimpleMetricsInterceptor: Error ${method} ${url} - ${statusCode} - ${executionTime}ms`,
                    );

                    this.metricsService.recordApiCall({
                        method,
                        url,
                        statusCode,
                        responseTime: executionTime,
                        timestamp: new Date(),
                        ip,
                        userAgent,
                    });
                },
            }),
        );
    }
}
