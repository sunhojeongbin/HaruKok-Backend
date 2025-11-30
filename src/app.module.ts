import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PresentationModule } from './presentation/presentation.module';
import { CommonModule } from './common/common.module';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { SimpleMetricsInterceptor } from './common/interceptors/simple-metrics.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CustomLoggerService } from './common/services/logger.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

/**
 * @description 애플리케이션 모듈
 */
@Module({
    imports: [
        ConfigModule, // 환경 설정 모듈
        PresentationModule, // 프레젠테이션 모듈
        CommonModule, // 공통 모듈

        // Rate Limiting 설정
        ThrottlerModule.forRoot([
            {
                ttl: 60000, // 1분
                limit: 100, // 1분에 100번 요청
            },
        ]),

        // JWT 모듈 설정
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
                signOptions: {
                    expiresIn: configService.get<number>('JWT_EXPIRES_IN') || 3600, // 1시간을 초 단위로
                },
            }),
            inject: [ConfigService],
        }),

        // Passport 모듈
        PassportModule.register({ defaultStrategy: 'jwt' }),
    ],
    controllers: [AppController],
    providers: [
        AppService,
        CustomLoggerService,
        JwtStrategy, // JWT 전략 추가
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter, // 전역 Exception Filter 등록
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard, // Rate Limiting 가드
        },
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard, // JWT 인증 가드 (전역 적용)
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
