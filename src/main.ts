import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './docs/swagger.config';
import { ConfigService } from '@nestjs/config';
import { createSwaggerAuthMiddleware } from './common/middleware/swagger-auth.middleware';

/**
 * @description 전역 파이프 적용
 */
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    app.setGlobalPrefix('v1'); // API 버전 설정
    if (process.env.NODE_ENV === 'production') {
        app.use('/api-docs', createSwaggerAuthMiddleware(configService)); // Swagger 인증 미들웨어 적용
    }

    setupSwagger(app); // Swagger 설정
    const port = configService.get<number>('PORT') || 3000;
    await app.listen(port); // PORT 환경 변수 설정, 기본값 3000
    console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
