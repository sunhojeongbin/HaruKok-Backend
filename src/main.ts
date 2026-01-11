import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /** @description 글로벌 Validation Pipe */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 없는 필드 제거
      forbidNonWhitelisted: true, // DTO에 없는 필드가 존재하면 에러 처리
      transform: true, // 요청 데이터를 DTO 타입으로 변환
    }),
  );

  /** @description 글로벌 응답 변환 인터셉터 */
  app.useGlobalInterceptors(new TransformInterceptor());

  /** @description 글로벌 예외 필터 */
  app.useGlobalFilters(new GlobalExceptionFilter());

  /** @description Swagger 설정 */
  const config = new DocumentBuilder()
    .setTitle('HaruKok API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
