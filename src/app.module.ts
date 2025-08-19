import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './infrastructure/config/config.module';
import { PresentationModule } from './presentation/presentation.module';
import { CommonModule } from './common/common.module';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { SimpleMetricsInterceptor } from './common/interceptors/simple-metrics.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CustomLoggerService } from './common/services/logger.service';

/**
 * @description 애플리케이션 모듈
 */
@Module({
    imports: [
        ConfigModule, // 환경 설정 모듈
        PresentationModule, // 프레젠테이션 모듈
        CommonModule, // 공통 모듈
    ],
    controllers: [AppController],
    providers: [
        AppService,
        CustomLoggerService,
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter, // 전역 Exception Filter 등록
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: SimpleMetricsInterceptor, // 간단한 메트릭 수집 인터셉터
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ResponseInterceptor, // 응답 변환 인터셉터 등록 (두 번째)
        },
    ],
})
export class AppModule {}
