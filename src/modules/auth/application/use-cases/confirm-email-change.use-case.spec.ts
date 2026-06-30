import { QueryFailedError } from 'typeorm';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { UsrEntity } from '../../../usr/entities/usr.entity';
import { UsrRepositoryPort } from '../../../usr/repositories/usr.repository.port';
import { AuthErrorCode } from '../../errors/auth-error-code';
import { AuthEmailCodeService } from '../services/auth-email-code.service';
import { ConfirmEmailChangeUseCase } from './confirm-email-change.use-case';

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

function buildUniqueViolationError(): QueryFailedError {
  const driverError = Object.assign(new Error('unique'), { code: '23505' });
  return new QueryFailedError('query', [], driverError);
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

describe('ConfirmEmailChangeUseCase', () => {
  const USER_ID = '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90';
  const NEW_EMAIL = 'new@harukok.com';
  const CODE = '123456';

  let usrRepository: jest.Mocked<UsrRepositoryPort>;
  let authEmailCodeService: jest.Mocked<
    Pick<AuthEmailCodeService, 'verifyCode' | 'clearCode'>
  >;

  beforeEach(() => {
    usrRepository = {
      isReady: jest.fn().mockReturnValue(true),
      findByEmail: jest.fn().mockResolvedValue(null),
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
      verifyCode: jest.fn().mockResolvedValue(undefined),
      clearCode: jest.fn().mockResolvedValue(undefined),
    };
  });

  function makeUseCase(): ConfirmEmailChangeUseCase {
    return new ConfirmEmailChangeUseCase(
      authEmailCodeService as unknown as AuthEmailCodeService,
      usrRepository,
    );
  }

  it('인증 성공 시 이메일을 교체하고 저장한다', async () => {
    const user = buildUsrEntity();
    usrRepository.findActiveById.mockResolvedValue(user);
    usrRepository.save.mockResolvedValue(user);

    const result = await makeUseCase().execute(USER_ID, NEW_EMAIL, CODE);

    expect(result).toEqual({ ok: true });
    expect(user.usrEmail).toBe(NEW_EMAIL);

    expect(authEmailCodeService.verifyCode).toHaveBeenCalledWith(
      NEW_EMAIL,
      CODE,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usrRepository.save).toHaveBeenCalledWith(user);

    expect(authEmailCodeService.clearCode).toHaveBeenCalledWith(NEW_EMAIL);
  });

  it('존재하지 않는 사용자이면 USER_NOT_FOUND를 던진다', async () => {
    usrRepository.findActiveById.mockResolvedValue(null);

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(USER_ID, NEW_EMAIL, CODE),
    );

    expect(code).toBe(AuthErrorCode.USER_NOT_FOUND);

    expect(authEmailCodeService.verifyCode).not.toHaveBeenCalled();
  });

  it('인증 번호가 올바르지 않으면 예외가 전파된다', async () => {
    usrRepository.findActiveById.mockResolvedValue(buildUsrEntity());
    authEmailCodeService.verifyCode.mockRejectedValue(
      new BusinessException(AuthErrorCode.EMAIL_CODE_INVALID),
    );

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(USER_ID, NEW_EMAIL, CODE),
    );

    expect(code).toBe(AuthErrorCode.EMAIL_CODE_INVALID);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usrRepository.save).not.toHaveBeenCalled();
  });

  it('이미 다른 사용자가 가입한 이메일이면 EMAIL_CHANGE_ALREADY_EXISTS를 던진다', async () => {
    usrRepository.findActiveById.mockResolvedValue(buildUsrEntity());
    usrRepository.findByEmail.mockResolvedValue(
      buildUsrEntity({ usrId: 'other-user-id', usrEmail: NEW_EMAIL }),
    );

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(USER_ID, NEW_EMAIL, CODE),
    );

    expect(code).toBe(AuthErrorCode.EMAIL_CHANGE_ALREADY_EXISTS);

    expect(authEmailCodeService.verifyCode).not.toHaveBeenCalled();
  });

  it('저장 시 unique 위반이면 EMAIL_CHANGE_ALREADY_EXISTS를 던진다', async () => {
    usrRepository.findActiveById.mockResolvedValue(buildUsrEntity());
    usrRepository.save.mockRejectedValue(buildUniqueViolationError());

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(USER_ID, NEW_EMAIL, CODE),
    );

    expect(code).toBe(AuthErrorCode.EMAIL_CHANGE_ALREADY_EXISTS);
  });

  it('그 외 저장 실패면 EMAIL_CHANGE_SAVE_FAILED를 던진다', async () => {
    usrRepository.findActiveById.mockResolvedValue(buildUsrEntity());
    usrRepository.save.mockRejectedValue(new Error('db error'));

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(USER_ID, NEW_EMAIL, CODE),
    );

    expect(code).toBe(AuthErrorCode.EMAIL_CHANGE_SAVE_FAILED);

    expect(authEmailCodeService.clearCode).not.toHaveBeenCalled();
  });
});
