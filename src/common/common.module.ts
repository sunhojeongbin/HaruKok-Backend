import { Module } from '@nestjs/common';
import { MetricsService } from './services/metrics.service';
import { SimpleMetricsInterceptor } from './interceptors/simple-metrics.interceptor';

@Module({
    providers: [MetricsService, SimpleMetricsInterceptor],
    exports: [MetricsService, SimpleMetricsInterceptor],
})
export class CommonModule {}
