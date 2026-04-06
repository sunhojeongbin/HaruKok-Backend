import { HttpException } from '@nestjs/common';
import { findResponseCodeByErrorCode } from '../errors/error-code-catalog';
import { ResponseCode } from '../response/response-code';

/**
 * @description 비즈니스 예외 처리
 * @example
 * ```ts
 * throw new BusinessException(UserResponse.USER_NOT_FOUND);
 * ```
 */
export class BusinessException extends HttpException {
  constructor(responseOrCode: ResponseCode | string) {
    const resolvedResponseCode =
      typeof responseOrCode === 'string'
        ? findResponseCodeByErrorCode(responseOrCode)
        : responseOrCode;

    if (!resolvedResponseCode) {
      const unknownErrorCode =
        typeof responseOrCode === 'string'
          ? responseOrCode
          : 'UNKNOWN_ERROR_CODE';

      super(
        {
          httpCode: 500,
          message: '서버에서 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
          success: false,
          errorCode: unknownErrorCode,
        },
        500,
      );
      return;
    }

    super(
      {
        httpCode: resolvedResponseCode.httpCode,
        message: resolvedResponseCode.message,
        success: false,
        errorCode: resolvedResponseCode.errorCode,
      },
      resolvedResponseCode.httpCode,
    );
  }
}
