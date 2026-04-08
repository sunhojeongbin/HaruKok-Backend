import { QueryFailedError } from 'typeorm';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { TodoErrorCodeValue } from '../../errors/todo-error-code';

/** @description 저장소 예외를 투두 도메인 예외로 변환한다. */
export function throwTodoPersistenceException(
  error: unknown,
  fallbackResponse: TodoErrorCodeValue,
): never {
  if (error instanceof BusinessException) {
    throw error;
  }

  if (error instanceof QueryFailedError) {
    throw new BusinessException(fallbackResponse);
  }

  throw new BusinessException(fallbackResponse);
}
