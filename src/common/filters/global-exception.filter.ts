import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch(HttpException)
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception.getStatus();
    const payload = exception.getResponse();

    // payload가 string일 수도, object일 수도 있음
    if (typeof payload === 'string') {
      return response.status(status).json({
        httpCode: status,
        message: payload,
        success: false,
      });
    }

    // Nest 기본 예외: { statusCode, message, error } or ValidationPipe: message가 배열
    const obj = payload as Record<string, any>;

    // BusinessException은 우리가 { httpCode, message, success, errorCode }로 던짐
    const httpCode =
      obj.httpCode ??
      obj.statusCode ??
      status ??
      HttpStatus.INTERNAL_SERVER_ERROR;

    // message가 배열(ValidationPipe)인 경우 첫 메시지 or join 처리
    const message = Array.isArray(obj.message)
      ? obj.message.join(', ')
      : (obj.message ?? '오류 발생');

    response.status(httpCode).json({
      httpCode,
      message,
      success: false,
      errorCode: obj.errorCode,
    });
  }
}
