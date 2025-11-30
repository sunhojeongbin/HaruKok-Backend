import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './docs/swagger.config';
import { ConfigService } from '@nestjs/config';
import { createSwaggerAuthMiddleware } from './common/middleware/swagger-auth.middleware';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';

/** @description 애플리케이션 부트스트랩 */
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const logger = new Logger('Bootstrap');
    // 🔒 보안 설정 (ValidationPipe 설정 전에 추가)
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"], // 기본 리소스는 자신의 도메인에서만 로드
                    styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'], // CSS 로드 정책
                    scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'], // JS 로드 정책
                    imgSrc: ["'self'", 'data:', 'https:'], // 이미지 로드 정책
                },
            },
            crossOriginEmbedderPolicy: false, // Swagger UI 호환성을 위해 비활성화
        }),
    );

    // cors 설정
    app.enableCors({
        origin: configService.get<string>('ALLOWED_ORIGINS')?.split(',') || [
            'http://localhost:3000',
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // HTTP 메서드 제한
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'], // 헤더 제한
        credentials: true, // 쿠키, 인증 헤더 포함 요청 허용
    });

    // 압축 미들웨어
    app.use(compression());

    // 전역 설정
    app.setGlobalPrefix('api/v1', {
        exclude: [
            'monitoring/(.*)', // 모니터링 경로는 글로벌 프리픽스에서 제외
            'test/simple-html', // 테스트 HTML도 제외
        ],
    });

    // 전역 ValidationPipe 설정
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true, // DTO 자동 변환
            whitelist: true, // DTO에 정의되지 않은 속성 제거
            forbidNonWhitelisted: true, // 정의되지 않은 속성 있을 시 에러
            skipMissingProperties: false, // 누락된 속성 체크
            validateCustomDecorators: true, // 커스텀 데코레이터 검증
            transformOptions: {
                enableImplicitConversion: true, // 암시적 타입 변환 허용
            },
        }),
    );

    // Swagger 인증 미들웨어 (운영환경에서만)
    if (process.env.NODE_ENV === 'production') {
        app.use('/api-docs', createSwaggerAuthMiddleware(configService));
    }

    // 전역 인터셉터 (중복 제거)
    // app.useGlobalInterceptors(new ResponseInterceptor()); // 이미 AppModule에서 설정됨

    // Swagger 설정
    setupSwagger(app);

    // 서버 시작
    const port = configService.get<number>('PORT') || 3000;
    const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

    await app.listen(port);

    logger.log(`🚀 Server running on http://localhost:${port}`);
    logger.log(`📚 API Docs available at http://localhost:${port}/api-docs`);
    logger.log(`🌍 Environment: ${nodeEnv}`);
}

bootstrap().catch((error) => {
    console.error('❌ Application failed to start', error);
    process.exit(1);
});
