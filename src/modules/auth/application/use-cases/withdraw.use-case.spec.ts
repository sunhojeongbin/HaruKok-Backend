import { BusinessException } from '../../../../common/exceptions/business.exception';
import { UsrEntity } from '../../../usr/entities/usr.entity';
import { UsrRepositoryPort } from '../../../usr/repositories/usr.repository.port';
import { AuthErrorCode } from '../../errors/auth-error-code';
import { WithdrawUseCase } from './withdraw.use-case';

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

describe('WithdrawUseCase', () => {
  const USER_ID = '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90';

  let usrRepository: jest.Mocked<UsrRepositoryPort>;

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
  });

  function makeUseCase(): WithdrawUseCase {
    return new WithdrawUseCase(usrRepository);
  }

  it('탈퇴 요청 시 사용자를 하드 삭제한다', async () => {
    usrRepository.findActiveById.mockResolvedValue(buildUsrEntity());
    usrRepository.hardDeleteById.mockResolvedValue(undefined);

    const result = await makeUseCase().execute(USER_ID);

    expect(result).toEqual({ ok: true });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usrRepository.hardDeleteById).toHaveBeenCalledWith(USER_ID);
  });

  it('존재하지 않는 사용자이면 USER_NOT_FOUND를 던진다', async () => {
    usrRepository.findActiveById.mockResolvedValue(null);

    const code = await resolveErrorCode(() => makeUseCase().execute(USER_ID));

    expect(code).toBe(AuthErrorCode.USER_NOT_FOUND);
  });

  it('hardDeleteById가 실패하면 WITHDRAW_SAVE_FAILED를 던진다', async () => {
    usrRepository.findActiveById.mockResolvedValue(buildUsrEntity());
    usrRepository.hardDeleteById.mockRejectedValue(new Error('db error'));

    const code = await resolveErrorCode(() => makeUseCase().execute(USER_ID));

    expect(code).toBe(AuthErrorCode.WITHDRAW_SAVE_FAILED);
  });
});
