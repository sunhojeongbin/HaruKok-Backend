import { BusinessException } from '../../../../common/exceptions/business.exception';
import { UsrEntity } from '../../../usr/entities/usr.entity';
import { UsrRepositoryPort } from '../../../usr/repositories/usr.repository.port';
import { AuthErrorCode } from '../../errors/auth-error-code';
import { AuthEmailCodeService } from '../services/auth-email-code.service';
import { RequestEmailChangeUseCase } from './request-email-change.use-case';

function buildUsrEntity(overrides: Partial<UsrEntity> = {}): UsrEntity {
  const now = new Date('2026-04-29T00:00:00.000Z');
  return {
    usrId: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
    usrEmail: 'current@harukok.com',
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

describe('RequestEmailChangeUseCase', () => {
  const USER_ID = '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90';
  const NEW_EMAIL = 'new@harukok.com';

  let usrRepository: jest.Mocked<UsrRepositoryPort>;
  let authEmailCodeService: jest.Mocked<
    Pick<AuthEmailCodeService, 'sendCode' | 'clearCode'>
  >;

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

    authEmailCodeService = {
      sendCode: jest.fn().mockResolvedValue(undefined),
      clearCode: jest.fn().mockResolvedValue(undefined),
    };
  });

  function makeUseCase(): RequestEmailChangeUseCase {
    return new RequestEmailChangeUseCase(
      authEmailCodeService as unknown as AuthEmailCodeService,
      usrRepository,
    );
  }

  it('미가입 새 이메일이면 인증 번호를 전송한다', async () => {
    usrRepository.findActiveById.mockResolvedValue(buildUsrEntity());
    usrRepository.findByEmail.mockResolvedValue(null);

    const result = await makeUseCase().execute(USER_ID, NEW_EMAIL);

    expect(result).toEqual({ ok: true });

    expect(authEmailCodeService.sendCode).toHaveBeenCalledWith(NEW_EMAIL);
  });

  it('존재하지 않는 사용자이면 USER_NOT_FOUND를 던진다', async () => {
    usrRepository.findActiveById.mockResolvedValue(null);

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(USER_ID, NEW_EMAIL),
    );

    expect(code).toBe(AuthErrorCode.USER_NOT_FOUND);

    expect(authEmailCodeService.sendCode).not.toHaveBeenCalled();
  });

  it('현재 이메일과 동일하면 EMAIL_CHANGE_SAME_AS_CURRENT를 던진다', async () => {
    usrRepository.findActiveById.mockResolvedValue(
      buildUsrEntity({ usrEmail: NEW_EMAIL }),
    );

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(USER_ID, NEW_EMAIL),
    );

    expect(code).toBe(AuthErrorCode.EMAIL_CHANGE_SAME_AS_CURRENT);

    expect(authEmailCodeService.sendCode).not.toHaveBeenCalled();
  });

  it('이미 다른 사용자가 가입한 이메일이면 EMAIL_CHANGE_ALREADY_EXISTS를 던지고 코드를 정리한다', async () => {
    usrRepository.findActiveById.mockResolvedValue(buildUsrEntity());
    usrRepository.findByEmail.mockResolvedValue(
      buildUsrEntity({ usrId: 'other-user-id', usrEmail: NEW_EMAIL }),
    );

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(USER_ID, NEW_EMAIL),
    );

    expect(code).toBe(AuthErrorCode.EMAIL_CHANGE_ALREADY_EXISTS);

    expect(authEmailCodeService.clearCode).toHaveBeenCalledWith(NEW_EMAIL);

    expect(authEmailCodeService.sendCode).not.toHaveBeenCalled();
  });

  it('메일 발송이 실패하면 예외가 전파된다', async () => {
    usrRepository.findActiveById.mockResolvedValue(buildUsrEntity());
    usrRepository.findByEmail.mockResolvedValue(null);
    authEmailCodeService.sendCode.mockRejectedValue(
      new BusinessException(AuthErrorCode.EMAIL_SEND_FAILED),
    );

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(USER_ID, NEW_EMAIL),
    );

    expect(code).toBe(AuthErrorCode.EMAIL_SEND_FAILED);
  });
});
