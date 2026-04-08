import { QueryFailedError } from 'typeorm';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { CtgErrorCode, CtgErrorCodeValue } from '../../errors/ctg-error-code';

/** @description 저장소 예외를 카테고리 도메인 예외로 변환한다. */
export function throwCtgPersistenceException(
  error: unknown,
  fallbackResponse: CtgErrorCodeValue,
): never {
  if (error instanceof BusinessException) {
    throw error;
  }

  if (error instanceof QueryFailedError) {
    const driverError = (
      error as QueryFailedError & { driverError?: { code?: string } }
    ).driverError;
    if (driverError?.code === '23505') {
      throw new BusinessException(CtgErrorCode.CATEGORY_NAME_DUPLICATED);
    }
  }

  throw new BusinessException(fallbackResponse);
}
