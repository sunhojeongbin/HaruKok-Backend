import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

/**
 * @description Swagger 설정
 */
export function setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
        .setTitle('HaruKok API')
        .setDescription('HaruKok API 문서')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config, {
        deepScanRoutes: true, // 라우트 깊이 스캔
    });
    SwaggerModule.setup('api-docs', app, document);
    console.log('Swagger UI is available at: /api-docs');
    console.log('API 문서가 Swagger UI에서 확인 가능합니다.');
    console.log('Swagger 문서가 생성되었습니다.');
}
