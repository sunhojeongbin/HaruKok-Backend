import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // JSON 파싱 실패 (body-parser가 던지는 SyntaxError)
    if (exception instanceof SyntaxError) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        httpCode: HttpStatus.BAD_REQUEST,
        message: '요청 본문의 형식이 올바르지 않습니다',
        success: false,
      });
    }

    // HttpException 계열이 아닌 예상치 못한 에러
    if (!(exception instanceof HttpException)) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        httpCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: '오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
        success: false,
      });
    }

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
    const obj =
      payload && typeof payload === 'object'
        ? (payload as Record<string, unknown>)
        : {};

    // BusinessException은 우리가 { httpCode, message, success, errorCode }로 던짐
    const httpCodeCandidate = obj.httpCode ?? obj.statusCode;
    const httpCode =
      typeof httpCodeCandidate === 'number'
        ? httpCodeCandidate
        : status || HttpStatus.INTERNAL_SERVER_ERROR;

    // message가 배열(ValidationPipe)인 경우 첫 메시지 or join 처리
    const messageCandidate = obj.message;
    const message = Array.isArray(messageCandidate)
      ? messageCandidate.map((item) => String(item)).join(', ')
      : typeof messageCandidate === 'string'
        ? messageCandidate
        : '오류가 발생했어요. 잠시 후 다시 시도해 주세요.';

    const errorCode =
      typeof obj.errorCode === 'string' ? obj.errorCode : undefined;

    response.status(httpCode).json({
      httpCode,
      message,
      success: false,
      errorCode,
    });
  }
}
