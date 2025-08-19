// src/common/services/metrics.service.ts
import { Injectable } from '@nestjs/common';
import * as os from 'os';

export interface ApiMetric {
    method: string;
    url: string;
    statusCode: number;
    responseTime: number;
    timestamp: Date;
    ip?: string;
    userAgent?: string;
}

export interface SystemMetrics {
    cpu: {
        usage: number;
        cores: number;
    };
    memory: {
        total: number;
        free: number;
        used: number;
        usagePercent: number;
    };
    uptime: number;
    timestamp: Date;
}

export interface PerformanceStats {
    totalRequests: number;
    averageResponseTime: number;
    slowRequests: number;
    errorRate: number;
    requestsPerMinute: number;
}

@Injectable()
export class MetricsService {
    private apiMetrics: ApiMetric[] = [];
    private readonly maxMetricsHistory = 1000; // 최대 1000개 기록 유지
    private startTime = new Date();

    /**
     * API 호출 메트릭 기록
     */
    recordApiCall(metric: ApiMetric) {
        console.log(`🔧 MetricsService: Recording API call`, {
            method: metric.method,
            url: metric.url,
            statusCode: metric.statusCode,
            responseTime: metric.responseTime,
        });

        this.apiMetrics.push({
            ...metric,
            timestamp: new Date(),
        });

        console.log(`📊 MetricsService: Total metrics count: ${this.apiMetrics.length}`);

        // 메트릭 히스토리 제한
        if (this.apiMetrics.length > this.maxMetricsHistory) {
            this.apiMetrics = this.apiMetrics.slice(-this.maxMetricsHistory);
        }
    }

    /**
     * 시스템 메트릭 수집
     */
    getSystemMetrics(): SystemMetrics {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;

        return {
            cpu: {
                usage: this.getCpuUsage(),
                cores: os.cpus().length,
            },
            memory: {
                total: totalMemory,
                free: freeMemory,
                used: usedMemory,
                usagePercent: (usedMemory / totalMemory) * 100,
            },
            uptime: process.uptime(),
            timestamp: new Date(),
        };
    }

    /**
     * API 성능 통계
     */
    getPerformanceStats(timeWindow: number = 5): PerformanceStats {
        const now = new Date();
        const windowStart = new Date(now.getTime() - timeWindow * 60 * 1000);

        const recentMetrics = this.apiMetrics.filter((metric) => metric.timestamp >= windowStart);

        const totalRequests = recentMetrics.length;
        const averageResponseTime =
            totalRequests > 0
                ? recentMetrics.reduce((sum, metric) => sum + metric.responseTime, 0) /
                  totalRequests
                : 0;

        const slowRequests = recentMetrics.filter((metric) => metric.responseTime > 1000).length;

        const errorRequests = recentMetrics.filter((metric) => metric.statusCode >= 400).length;

        const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
        const requestsPerMinute = totalRequests / timeWindow;

        return {
            totalRequests,
            averageResponseTime: Math.round(averageResponseTime),
            slowRequests,
            errorRate: Math.round(errorRate * 100) / 100,
            requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
        };
    }

    /**
     * 최근 API 호출 기록
     */
    getRecentApiCalls(limit: number = 50): ApiMetric[] {
        return this.apiMetrics
            .slice(-limit)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    /**
     * 엔드포인트별 성능 통계
     */
    getEndpointStats() {
        const endpointMap = new Map<
            string,
            {
                count: number;
                totalTime: number;
                errors: number;
                slowRequests: number;
            }
        >();

        this.apiMetrics.forEach((metric) => {
            const key = `${metric.method} ${metric.url}`;
            const existing = endpointMap.get(key) || {
                count: 0,
                totalTime: 0,
                errors: 0,
                slowRequests: 0,
            };

            existing.count++;
            existing.totalTime += metric.responseTime;
            if (metric.statusCode >= 400) existing.errors++;
            if (metric.responseTime > 1000) existing.slowRequests++;

            endpointMap.set(key, existing);
        });

        return Array.from(endpointMap.entries()).map(([endpoint, stats]) => ({
            endpoint,
            count: stats.count,
            averageTime: Math.round(stats.totalTime / stats.count),
            errorRate: Math.round((stats.errors / stats.count) * 10000) / 100,
            slowRequestRate: Math.round((stats.slowRequests / stats.count) * 10000) / 100,
        }));
    }

    /**
     * 애플리케이션 상태 정보
     */
    getApplicationInfo() {
        return {
            name: 'HaruKok-BE',
            version: '1.0.0',
            nodeVersion: process.version,
            platform: os.platform(),
            startTime: this.startTime,
            uptime: process.uptime(),
            pid: process.pid,
            environment: process.env.NODE_ENV || 'development',
        };
    }

    /**
     * CPU 사용률 계산 (간단한 구현)
     */
    private getCpuUsage(): number {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;

        cpus.forEach((cpu) => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });

        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;

        return Math.round(100 - (100 * idle) / total);
    }

    /**
     * 메트릭 초기화 (테스트용)
     */
    clearMetrics() {
        this.apiMetrics = [];
    }
}
