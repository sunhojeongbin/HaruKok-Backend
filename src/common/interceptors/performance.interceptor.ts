// src/common/interceptors/performance.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { CustomLoggerService } from '../services/logger.service';
import { MetricsService } from '../services/metrics.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
    constructor(
        private readonly logger: CustomLoggerService,
        private readonly metricsService: MetricsService,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const now = Date.now();
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();

        const { method, url, ip } = request;
        const userAgent = request.get('User-Agent') || '';

        // 모니터링 경로는 메트릭 수집에서 제외
        const isMonitoringPath = url.startsWith('/monitoring');

        if (isMonitoringPath) {
            // 모니터링 경로는 메트릭 수집 없이 바로 진행
            return next.handle();
        }

        // 요청 시작 로깅
        this.logger.log(`→ ${method} ${url} - ${ip}`, 'HTTP_REQUEST');
        this.logger.debug(`User-Agent: ${userAgent}`, 'HTTP_REQUEST');

        return next.handle().pipe(
            tap({
                next: (responseData) => {
                    this.logSuccess(now, method, url, response.statusCode || 200);
                },
                error: (error) => {
                    this.logError(now, method, url, error);
                },
                complete: () => {
                    const executionTime = Date.now() - now;
                    const statusCode = response.statusCode;

                    // 디버그 로그 추가
                    this.logger.debug(
                        `🔧 DEBUG: Recording API call - ${method} ${url} ${statusCode} ${executionTime}ms`,
                        'PERFORMANCE_DEBUG',
                    );

                    // 메트릭 수집
                    try {
                        this.metricsService.recordApiCall({
                            method,
                            url,
                            statusCode,
                            responseTime: executionTime,
                            timestamp: new Date(),
                            ip,
                            userAgent,
                        });
                        this.logger.debug(`✅ Metric recorded successfully`, 'PERFORMANCE_DEBUG');
                    } catch (error) {
                        this.logger.error(
                            `❌ Failed to record metric: ${error.message}`,
                            error.stack,
                            'PERFORMANCE_ERROR',
                        );
                    }

                    this.logger.logHttpRequest(method, url, statusCode, executionTime);

                    // 느린 요청 감지
                    if (executionTime > 3000) {
                        this.logger.warn(
                            `🐌 Slow request: ${method} ${url} took ${executionTime}ms`,
                            'PERFORMANCE',
                        );
                    } else if (executionTime > 1000) {
                        this.logger.log(
                            `⚠️  Medium-slow request: ${method} ${url} took ${executionTime}ms`,
                            'PERFORMANCE',
                        );
                    }
                },
            }),
        );
    }

    private logSuccess(startTime: number, method: string, url: string, statusCode: number) {
        const executionTime = Date.now() - startTime;
        const statusEmoji = this.getStatusEmoji(statusCode);

        this.logger.log(
            `${statusEmoji} ← ${method} ${url} ${statusCode} - ${executionTime}ms`,
            'HTTP_RESPONSE',
        );
    }

    private logError(startTime: number, method: string, url: string, error: any) {
        const executionTime = Date.now() - startTime;
        const statusCode = error.status || 500;

        this.logger.error(
            `❌ ← ${method} ${url} ${statusCode} - ${executionTime}ms - ${error.message}`,
            error.stack,
            'HTTP_ERROR',
        );
    }

    private getStatusEmoji(statusCode: number): string {
        if (statusCode >= 200 && statusCode < 300) return '✅';
        if (statusCode >= 300 && statusCode < 400) return '↩️';
        if (statusCode >= 400 && statusCode < 500) return '⚠️';
        if (statusCode >= 500) return '🔥';
        return '❓';
    }
}
