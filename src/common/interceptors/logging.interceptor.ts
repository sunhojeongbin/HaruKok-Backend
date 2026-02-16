import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const method = request.method;
    const url = request.originalUrl;
    const ip = request.ip;

    this.logger.log(`[REQ] ${method} ${url} ip=${ip}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          this.logger.log(
            `[RES] ${method} ${url} status=${response.statusCode} ${duration}ms`,
          );
        },
        error: (error: unknown) => {
          const duration = Date.now() - now;
          const status =
            error instanceof HttpException
              ? error.getStatus()
              : HttpStatus.INTERNAL_SERVER_ERROR;
          const message =
            error instanceof Error ? error.message : 'Unknown error';

          this.logger.error(
            `[ERR] ${method} ${url} status=${status} ${duration}ms message=${message}`,
          );
        },
      }),
    );
  }
}
