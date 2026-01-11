import { HttpException } from '@nestjs/common';
import { ResponseCode } from '../response/response-code';

/**
 * @description 비즈니스 예외 처리
 * @example
 * ```ts
 * throw new BusinessException(UserResponse.USER_NOT_FOUND);
 * ```
 */
export class BusinessException extends HttpException {
  constructor(responseCode: ResponseCode) {
    super(
      {
        httpCode: responseCode.httpCode,
        message: responseCode.message,
        success: false,
        errorCode: responseCode.errorCode,
      },
      responseCode.httpCode,
    );
  }
}
