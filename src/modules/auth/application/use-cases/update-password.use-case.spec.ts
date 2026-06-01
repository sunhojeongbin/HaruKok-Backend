import { BusinessException } from '../../../../common/exceptions/business.exception';
import { UsrEntity } from '../../../usr/entities/usr.entity';
import { UsrRepositoryPort } from '../../../usr/repositories/usr.repository.port';
import { AuthErrorCode } from '../../errors/auth-error-code';
import { AuthPasswordService } from '../../services/auth-password.service';
import { AuthRefreshTokenStoreService } from '../../services/rft-store.service';
import { UpdatePasswordUseCase } from './update-password.use-case';

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
    isDeleted: false,
    deletedAt: null,
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

describe('UpdatePasswordUseCase', () => {
  const USER_ID = '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90';

  let usrRepository: jest.Mocked<UsrRepositoryPort>;
  let authPasswordService: {
    verifyPassword: jest.Mock;
    hashPassword: jest.Mock;
    algorithm: string;
  };
  let refreshTokenStore: jest.Mocked<AuthRefreshTokenStoreService>;

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
      hashPassword: jest.fn().mockResolvedValue('new-hashed-password'),
      algorithm: 'argon2id',
    };

    refreshTokenStore = {
      upsertToken: jest.fn(),
      verifyToken: jest.fn(),
      revokeToken: jest.fn(),
    } as jest.Mocked<AuthRefreshTokenStoreService>;
  });

  function makeUseCase(): UpdatePasswordUseCase {
    return new UpdatePasswordUseCase(
      authPasswordService as unknown as AuthPasswordService,
      refreshTokenStore,
      usrRepository,
    );
  }

  it('올바른 현재 비밀번호와 새 비밀번호로 변경 후 토큰을 폐기한다', async () => {
    const user = buildUsrEntity();
    usrRepository.findActiveById.mockResolvedValue(user);
    authPasswordService.verifyPassword
      .mockResolvedValueOnce(true) // 현재 비밀번호 확인
      .mockResolvedValueOnce(false); // 새 비밀번호 동일 여부 확인
    usrRepository.save.mockResolvedValue(user);
    refreshTokenStore.revokeToken.mockResolvedValue(undefined);

    const result = await makeUseCase().execute(USER_ID, 'current', 'New1!pass');

    expect(result).toEqual({ ok: true });
    expect(user.pwd).toBe('new-hashed-password');
    expect(user.pwdHash).toBe('argon2id');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usrRepository.save).toHaveBeenCalledWith(user);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(refreshTokenStore.revokeToken).toHaveBeenCalledWith({
      usrId: USER_ID,
      reason: 'PASSWORD_CHANGE',
    });
  });

  it('존재하지 않는 사용자이면 USER_NOT_FOUND를 던진다', async () => {
    usrRepository.findActiveById.mockResolvedValue(null);

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(USER_ID, 'current', 'New1!pass'),
    );

    expect(code).toBe(AuthErrorCode.USER_NOT_FOUND);
  });

  it('소셜 로그인 사용자이면 UPDATE_PASSWORD_NOT_AVAILABLE을 던진다', async () => {
    usrRepository.findActiveById.mockResolvedValue(
      buildUsrEntity({ joinTypeCd: 'KAKAO', pwd: null, pwdHash: null }),
    );

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(USER_ID, 'current', 'New1!pass'),
    );

    expect(code).toBe(AuthErrorCode.UPDATE_PASSWORD_NOT_AVAILABLE);
    expect(authPasswordService.verifyPassword).not.toHaveBeenCalled();
  });

  it('현재 비밀번호가 틀리면 UPDATE_PASSWORD_WRONG_CURRENT를 던진다', async () => {
    usrRepository.findActiveById.mockResolvedValue(buildUsrEntity());
    authPasswordService.verifyPassword.mockResolvedValueOnce(false);

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(USER_ID, 'wrong', 'New1!pass'),
    );

    expect(code).toBe(AuthErrorCode.UPDATE_PASSWORD_WRONG_CURRENT);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usrRepository.save).not.toHaveBeenCalled();
  });

  it('새 비밀번호가 현재 비밀번호와 동일하면 UPDATE_PASSWORD_SAME_AS_CURRENT를 던진다', async () => {
    usrRepository.findActiveById.mockResolvedValue(buildUsrEntity());
    authPasswordService.verifyPassword
      .mockResolvedValueOnce(true) // 현재 비밀번호 확인
      .mockResolvedValueOnce(true); // 새 비밀번호 동일

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(USER_ID, 'current', 'current'),
    );

    expect(code).toBe(AuthErrorCode.UPDATE_PASSWORD_SAME_AS_CURRENT);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usrRepository.save).not.toHaveBeenCalled();
  });

  it('repo.save가 실패하면 UPDATE_PASSWORD_SAVE_FAILED를 던진다', async () => {
    const user = buildUsrEntity();
    usrRepository.findActiveById.mockResolvedValue(user);
    authPasswordService.verifyPassword
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    usrRepository.save.mockRejectedValue(new Error('db error'));

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(USER_ID, 'current', 'New1!pass'),
    );

    expect(code).toBe(AuthErrorCode.UPDATE_PASSWORD_SAVE_FAILED);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(refreshTokenStore.revokeToken).not.toHaveBeenCalled();
  });

  it('토큰 폐기가 실패하면 UPDATE_PASSWORD_SAVE_FAILED를 던진다', async () => {
    const user = buildUsrEntity();
    usrRepository.findActiveById.mockResolvedValue(user);
    authPasswordService.verifyPassword
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    usrRepository.save.mockResolvedValue(user);
    refreshTokenStore.revokeToken.mockRejectedValue(new Error('redis error'));

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(USER_ID, 'current', 'New1!pass'),
    );

    expect(code).toBe(AuthErrorCode.UPDATE_PASSWORD_SAVE_FAILED);
  });
});
