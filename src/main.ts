import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

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
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

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
    swaggerOptions: {
      persistAuthorization: true,
      responseInterceptor: (response: {
        status?: number;
        url?: string;
        body?: unknown;
        data?: unknown;
        text?: string;
      }) => {
        try {
          if (!response.url?.includes('/auth/login')) {
            return response;
          }

          if (
            !response.status ||
            response.status < 200 ||
            response.status >= 300
          ) {
            return response;
          }

          let payload:
            | {
                data?: {
                  accessToken?: string;
                };
              }
            | undefined =
            (response.body as
              | { data?: { accessToken?: string } }
              | undefined) ??
            (response.data as { data?: { accessToken?: string } } | undefined);
          if (!payload && typeof response.text === 'string') {
            payload = JSON.parse(response.text) as {
              data?: {
                accessToken?: string;
              };
            };
          }

          const accessToken = payload?.data?.accessToken;
          if (accessToken) {
            const swaggerWindow = window as Window & {
              ui?: {
                preauthorizeApiKey?: (name: string, value: string) => void;
              };
            };
            const preauthorizeApiKey = swaggerWindow.ui?.preauthorizeApiKey;
            if (typeof preauthorizeApiKey === 'function') {
              preauthorizeApiKey('bearer', accessToken);
              preauthorizeApiKey('Bearer', accessToken);
            }
          }
        } catch {
          // Swagger interceptor 내부 파싱 실패는 무시하고 원 응답을 유지
        }

        return response;
      },
    },
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
