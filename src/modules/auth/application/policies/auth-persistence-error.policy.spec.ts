import { QueryFailedError } from 'typeorm';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { AuthErrorCode } from '../../errors/auth-error-code';
import { throwIfAuthDuplicatePersistenceError } from './auth-persistence-error.policy';

describe('Auth Persistence Error Policy', () => {
  const resolveErrorCode = (action: () => void): string | undefined => {
    try {
      action();
      return undefined;
    } catch (error) {
      if (!(error instanceof BusinessException)) {
        throw error;
      }

      const response = error.getResponse();
      if (!response || typeof response !== 'object') {
        return undefined;
      }

      return (response as { errorCode?: string }).errorCode;
    }
  };

  it('postgres 중복 키(23505)는 SIGNUP_ALREADY_EXISTS로 변환한다', () => {
    const duplicateError = new QueryFailedError(
      'insert',
      [],
      Object.assign(new Error('duplicate key'), { code: '23505' }),
    );

    expect(() => throwIfAuthDuplicatePersistenceError(duplicateError)).toThrow(
      BusinessException,
    );
    expect(
      resolveErrorCode(() =>
        throwIfAuthDuplicatePersistenceError(duplicateError),
      ),
    ).toBe(AuthErrorCode.SIGNUP_ALREADY_EXISTS);
  });

  it('중복 키가 아닌 QueryFailedError는 그대로 다시 던진다', () => {
    const queryError = new QueryFailedError(
      'insert',
      [],
      Object.assign(new Error('other db error'), { code: '22001' }),
    );

    try {
      throwIfAuthDuplicatePersistenceError(queryError);
      throw new Error('expected throw');
    } catch (error) {
      expect(error).toBe(queryError);
    }
  });

  it('일반 에러는 그대로 다시 던진다', () => {
    const unknownError = new Error('unknown');

    try {
      throwIfAuthDuplicatePersistenceError(unknownError);
      throw new Error('expected throw');
    } catch (error) {
      expect(error).toBe(unknownError);
    }
  });
});
