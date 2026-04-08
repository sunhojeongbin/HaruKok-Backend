import { QueryFailedError } from 'typeorm';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { AuthErrorCode } from '../../errors/auth-error-code';

/** @description 회원가입 저장소 예외에서 중복 키 예외를 도메인 예외로 변환한다. */
export function throwIfAuthDuplicatePersistenceError(error: unknown): never {
  if (error instanceof BusinessException) {
    throw error;
  }

  if (error instanceof QueryFailedError) {
    const driverError = (
      error as QueryFailedError & { driverError?: { code?: string } }
    ).driverError;
    if (driverError?.code === '23505') {
      throw new BusinessException(AuthErrorCode.SIGNUP_ALREADY_EXISTS);
    }
  }

  throw error;
}
