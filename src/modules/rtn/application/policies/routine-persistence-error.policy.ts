import { QueryFailedError } from 'typeorm';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { RtnErrorCodeValue } from '../../errors/rtn-error-code';

/** @description 저장소 예외를 루틴 도메인 예외로 변환한다. */
export function throwRoutinePersistenceException(
  error: unknown,
  fallbackResponse: RtnErrorCodeValue,
): never {
  if (error instanceof BusinessException) {
    throw error;
  }

  if (error instanceof QueryFailedError) {
    throw new BusinessException(fallbackResponse);
  }

  throw new BusinessException(fallbackResponse);
}
