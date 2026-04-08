import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { BusinessException } from './common/exceptions/business.exception';
import { TodoResponse } from './common/response/todo.response';
import { SearchTodosQueryDto } from './modules/todo/presentation/dtos/search-todos-query.dto';

function flattenValidationErrors(errors: ValidationError[]): ValidationError[] {
  return errors.flatMap((error) => [
    error,
    ...flattenValidationErrors(error.children ?? []),
  ]);
}

function collectValidationMessages(errors: ValidationError[]): string[] {
  return flattenValidationErrors(errors).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );
}

function hasSearchKeywordValidationError(errors: ValidationError[]): boolean {
  return flattenValidationErrors(errors).some(
    (error) =>
      error.property === 'keyword' &&
      error.target instanceof SearchTodosQueryDto,
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /** @description 글로벌 Validation Pipe */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 없는 필드 제거
      forbidNonWhitelisted: true, // DTO에 없는 필드가 존재하면 에러 처리
      transform: true, // 요청 데이터를 DTO 타입으로 변환
      exceptionFactory: (errors: ValidationError[] = []) => {
        if (hasSearchKeywordValidationError(errors)) {
          return new BusinessException(
            TodoResponse.TODO_SEARCH_KEYWORD_INVALID,
          );
        }

        const messages = collectValidationMessages(errors);
        return new BadRequestException(
          messages.length > 0 ? messages : '입력값 검증에 실패했습니다.',
        );
      },
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
    .setDescription(
      [
        'HaruKok 백엔드 API 문서입니다.',
        '',
        '인증 사용 순서:',
        '1) `POST /auth/login` 호출',
        '2) 응답의 `accessToken`으로 상단 Authorize(Bearer) 설정',
        '3) 만료 시 `POST /auth/refresh` 호출 (HttpOnly 쿠키 기반)',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      onComplete: () => {
        try {
          const swaggerWindow = window as Window & {
            ui?: {
              preauthorizeApiKey?: (name: string, value: string) => void;
              getSystem?: () => {
                authActions?: {
                  logout?: (...args: unknown[]) => unknown;
                };
              };
            };
            __harukokSwaggerLogoutPatched?: boolean;
          };
          const persistedAccessToken = localStorage.getItem(
            'HARUKOK_SWAGGER_ACCESS_TOKEN',
          );
          const preauthorizeApiKey = swaggerWindow.ui?.preauthorizeApiKey;
          if (
            persistedAccessToken &&
            typeof preauthorizeApiKey === 'function'
          ) {
            preauthorizeApiKey('bearer', persistedAccessToken);
            preauthorizeApiKey('Bearer', persistedAccessToken);
          }

          if (!swaggerWindow.__harukokSwaggerLogoutPatched) {
            const authActions = swaggerWindow.ui?.getSystem?.().authActions as
              | {
                  logout?: (...args: unknown[]) => unknown;
                }
              | undefined;

            const originalLogout = authActions?.logout;
            if (typeof originalLogout === 'function') {
              authActions.logout = (...args: unknown[]) => {
                try {
                  localStorage.removeItem('HARUKOK_SWAGGER_ACCESS_TOKEN');
                } catch {
                  // localStorage 접근 실패는 무시
                }
                return originalLogout(...args);
              };
              swaggerWindow.__harukokSwaggerLogoutPatched = true;
            }
          }
        } catch {
          // Swagger 초기화 과정의 부가 처리 실패는 무시
        }
      },
      responseInterceptor: (response: {
        status?: number;
        url?: string;
        body?: unknown;
        data?: unknown;
        text?: string;
      }) => {
        try {
          const swaggerWindow = window as Window & {
            ui?: {
              preauthorizeApiKey?: (name: string, value: string) => void;
              getSystem?: () => {
                authActions?: {
                  logout?: (...args: unknown[]) => unknown;
                };
              };
            };
          };
          const isSuccessResponse =
            !!response.status &&
            response.status >= 200 &&
            response.status < 300;
          const isLogoutResponse = response.url?.includes('/auth/logout');
          if (isLogoutResponse && isSuccessResponse) {
            try {
              localStorage.removeItem('HARUKOK_SWAGGER_ACCESS_TOKEN');
            } catch {
              // localStorage 접근 실패는 무시
            }

            const authActions = swaggerWindow.ui?.getSystem?.().authActions as
              | {
                  logout?: (...args: unknown[]) => unknown;
                }
              | undefined;
            if (typeof authActions?.logout === 'function') {
              try {
                authActions.logout({ bearer: {} });
              } catch {
                // 보안 스키마 키 불일치 가능성을 고려해 무시
              }
              try {
                authActions.logout({ Bearer: {} });
              } catch {
                // 보안 스키마 키 불일치 가능성을 고려해 무시
              }
            }

            return response;
          }

          const isAuthTokenResponse =
            response.url?.includes('/auth/login') ||
            response.url?.includes('/auth/refresh');
          if (!isAuthTokenResponse) {
            return response;
          }

          if (!isSuccessResponse) {
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
            try {
              localStorage.setItem('HARUKOK_SWAGGER_ACCESS_TOKEN', accessToken);
            } catch {
              // localStorage 접근 실패는 무시
            }

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
