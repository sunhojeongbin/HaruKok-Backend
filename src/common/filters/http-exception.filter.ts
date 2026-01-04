import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponseDto } from '../dto/api-response.dto';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = exception.message;
    let errorCode: string | undefined;

    // 예외 응답이 객체인 경우 메시지 추출
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as {
        message?: string | string[];
        errorCode?: string;
      };

      if (responseObj.message) {
        // message가 배열인 경우 (validation error)
        if (Array.isArray(responseObj.message)) {
          message = responseObj.message.join(', ');
        } else {
          message = responseObj.message;
        }
      }

      errorCode = responseObj.errorCode;
    }

    const errorResponse = ApiResponseDto.error(
      message,
      status,
      errorCode || this.getErrorCode(status),
    );

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    const errorCodes: { [key: number]: string } = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
    };

    return errorCodes[status] || 'UNKNOWN_ERROR';
  }
}
