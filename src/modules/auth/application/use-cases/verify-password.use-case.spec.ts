import { BusinessException } from '../../../../common/exceptions/business.exception';
import { UsrEntity } from '../../../usr/entities/usr.entity';
import { UsrRepositoryPort } from '../../../usr/repositories/usr.repository.port';
import { AuthErrorCode } from '../../errors/auth-error-code';
import { AuthPasswordService } from '../../services/auth-password.service';
import { VerifyPasswordUseCase } from './verify-password.use-case';

function buildUsrEntity(overrides: Partial<UsrEntity> = {}): UsrEntity {
  const now = new Date('2026-04-29T00:00:00.000Z');
  return {
    usrId: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
    usrEmail: 'jihoon.kim@harukok.com',
    usrNm: '김지훈',
    pwd: 'stored-hash',
    pwdHash: 'argon2id',
    joinTypeCd: 'EMAIL',
    usrStatCd: 'ACTIVE',
    usrRoleCd: 'USER',
    emailVerifiedAt: null,
    lastLoginAt: null,
    failedLoginCnt: 0,
    lockedUntil: null,
    createdAt: now,
    updatedAt: now,
    usrSocials: [],
    ...overrides,
  };
}

const resolveErrorCode = async (
  action: () => Promise<unknown>,
): Promise<string | undefined> => {
  try {
    await action();
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

describe('VerifyPasswordUseCase', () => {
  const USER_ID = '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90';

  let usrRepository: jest.Mocked<UsrRepositoryPort>;
  let authPasswordService: { verifyPassword: jest.Mock };

  beforeEach(() => {
    usrRepository = {
      isReady: jest.fn().mockReturnValue(true),
      findByEmail: jest.fn(),
      findActiveByEmail: jest.fn(),
      findById: jest.fn(),
      findActiveById: jest.fn(),
      countAcceptedFrds: jest.fn(),
      getTodoDashboardMetrics: jest.fn(),
      createAndSave: jest.fn(),
      save: jest.fn(),
      hardDeleteById: jest.fn(),
    };

    authPasswordService = {
      verifyPassword: jest.fn(),
    };
  });

  function makeUseCase(): VerifyPasswordUseCase {
    return new VerifyPasswordUseCase(
      authPasswordService as unknown as AuthPasswordService,
      usrRepository,
    );
  }

  it('올바른 비밀번호이면 matched: true를 반환한다', async () => {
    usrRepository.findActiveById.mockResolvedValue(buildUsrEntity());
    authPasswordService.verifyPassword.mockResolvedValue(true);

    const result = await makeUseCase().execute(USER_ID, 'correct-pass');

    expect(result).toEqual({ matched: true });
  });

  it('잘못된 비밀번호이면 matched: false를 반환한다', async () => {
    usrRepository.findActiveById.mockResolvedValue(buildUsrEntity());
    authPasswordService.verifyPassword.mockResolvedValue(false);

    const result = await makeUseCase().execute(USER_ID, 'wrong-pass');

    expect(result).toEqual({ matched: false });
  });

  it('소셜 로그인 사용자이면 matched: false를 반환한다', async () => {
    usrRepository.findActiveById.mockResolvedValue(
      buildUsrEntity({ joinTypeCd: 'KAKAO', pwd: null, pwdHash: null }),
    );

    const result = await makeUseCase().execute(USER_ID, 'any-pass');

    expect(result).toEqual({ matched: false });
    expect(authPasswordService.verifyPassword).not.toHaveBeenCalled();
  });

  it('존재하지 않는 사용자이면 USER_NOT_FOUND를 던진다', async () => {
    usrRepository.findActiveById.mockResolvedValue(null);

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(USER_ID, 'any-pass'),
    );

    expect(code).toBe(AuthErrorCode.USER_NOT_FOUND);
  });
});
