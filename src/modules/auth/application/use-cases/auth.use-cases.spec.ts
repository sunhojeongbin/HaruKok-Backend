import { QueryFailedError } from 'typeorm';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { UsrEntity } from '../../../usr/entities/usr.entity';
import { UsrRepositoryPort } from '../../../usr/repositories/usr.repository.port';
import { AuthPasswordService } from '../../services/auth-password.service';
import { AuthTemporaryPasswordService } from '../../services/auth-temporary-password.service';
import { AuthTokenService } from '../../services/auth-token.service';
import { AuthRefreshTokenStoreService } from '../../services/rft-store.service';
import { AuthFallbackService } from '../../services/auth-fallback.service';
import { AuthErrorCode } from '../../errors/auth-error-code';
import { DeviceType, RevokeReason } from '../../enums/refresh-token.enum';
import { AuthEmailCodeService } from '../services/auth-email-code.service';
import { GetUserByIdUseCase } from './get-user-by-id.use-case';
import { LoginUseCase } from './login.use-case';
import { LogoutUseCase } from './logout.use-case';
import { RefreshUseCase } from './refresh.use-case';
import { ResendEmailCodeUseCase } from './resend-email-code.use-case';
import { ResetPasswordUseCase } from './reset-password.use-case';
import { SendEmailCodeUseCase } from './send-email-code.use-case';
import { SendTemporaryPasswordUseCase } from './send-temporary-password.use-case';
import { SignupUseCase } from './signup.use-case';
import { VerifyEmailCodeUseCase } from './verify-email-code.use-case';

function buildUser(overrides: Partial<UsrEntity> = {}): UsrEntity {
  const now = new Date('2026-04-08T00:00:00.000Z');
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

const issuedTokenPair = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  refreshTokenMaxAgeMs: 30_000,
  jti: 'jti-1',
  refreshTokenExpiresAt: new Date('2026-05-08T00:00:00.000Z'),
};

const refreshPayload = {
  sub: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
  email: 'jihoon.kim@harukok.com',
  jti: 'jti-1',
};

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

describe('Auth UseCases', () => {
  let usrRepository: jest.Mocked<UsrRepositoryPort>;

  let authTokenService: {
    issueTokenPair: jest.Mock;
    verifyRefreshToken: jest.Mock;
    issueSignupToken: jest.Mock;
    verifySignupToken: jest.Mock;
  };

  let authPasswordService: {
    algorithm: string;
    verifyPassword: jest.Mock;
    hashPassword: jest.Mock;
  };

  let authFallbackService: {
    tryLogin: jest.Mock;
    tryRefresh: jest.Mock;
    logout: jest.Mock;
    getUserById: jest.Mock;
  };

  let refreshTokenStore: jest.Mocked<AuthRefreshTokenStoreService>;

  let authEmailCodeService: {
    sendCode: jest.Mock;
    resendCode: jest.Mock;
    verifyCode: jest.Mock;
    clearCode: jest.Mock;
  };

  let authTemporaryPasswordService: {
    sendTemporaryPassword: jest.Mock;
    verifyAndConsumeTemporaryPassword: jest.Mock;
    verifyTemporaryPasswordWithoutConsuming: jest.Mock;
    consumeTemporaryPassword: jest.Mock;
  };

  beforeEach(() => {
    usrRepository = {
      isReady: jest.fn(),
      findByEmail: jest.fn(),
      findActiveByEmail: jest.fn(),
      findById: jest.fn(),
      findActiveById: jest.fn(),
      countAcceptedFriends: jest.fn(),
      getTodoDashboardMetrics: jest.fn(),
      createAndSave: jest.fn(),
      save: jest.fn(),
    };

    authTokenService = {
      issueTokenPair: jest.fn(),
      verifyRefreshToken: jest.fn(),
      issueSignupToken: jest.fn(),
      verifySignupToken: jest.fn(),
    };

    authPasswordService = {
      algorithm: 'argon2id',
      verifyPassword: jest.fn(),
      hashPassword: jest.fn(),
    };

    authFallbackService = {
      tryLogin: jest.fn(),
      tryRefresh: jest.fn(),
      logout: jest.fn(),
      getUserById: jest.fn(),
    };

    refreshTokenStore = {
      upsertToken: jest.fn(),
      verifyToken: jest.fn(),
      revokeToken: jest.fn(),
    } as jest.Mocked<AuthRefreshTokenStoreService>;

    authEmailCodeService = {
      sendCode: jest.fn(),
      resendCode: jest.fn(),
      verifyCode: jest.fn(),
      clearCode: jest.fn(),
    };

    authTemporaryPasswordService = {
      sendTemporaryPassword: jest.fn(),
      verifyAndConsumeTemporaryPassword: jest.fn(),
      verifyTemporaryPasswordWithoutConsuming: jest.fn(),
      consumeTemporaryPassword: jest.fn(),
    };
  });

  describe('GetUserByIdUseCase', () => {
    it('repository가 준비되지 않으면 fallback 조회를 사용한다', async () => {
      usrRepository.isReady.mockReturnValue(false);
      authFallbackService.getUserById.mockReturnValue({
        id: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        name: '김지훈',
        email: 'fallback.tester@harukok.com',
      });

      const useCase = new GetUserByIdUseCase(
        authFallbackService as unknown as AuthFallbackService,
        usrRepository,
      );

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
      );

      expect(result?.email).toBe('fallback.tester@harukok.com');
      expect(authFallbackService.getUserById.mock.calls).toEqual([
        ['7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90'],
      ]);
    });

    it('active user를 조회해 응답 포맷으로 반환한다', async () => {
      usrRepository.isReady.mockReturnValue(true);
      usrRepository.findActiveById.mockResolvedValue(buildUser());
      usrRepository.countAcceptedFriends.mockResolvedValue(3);

      const useCase = new GetUserByIdUseCase(
        authFallbackService as unknown as AuthFallbackService,
        usrRepository,
      );

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
      );

      expect(result).toEqual({
        id: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        name: '김지훈',
        email: 'jihoon.kim@harukok.com',
        friendCount: 3,
      });
    });
  });

  describe('LoginUseCase', () => {
    it('repository가 준비되지 않으면 fallback 로그인으로 위임한다', async () => {
      usrRepository.isReady.mockReturnValue(false);
      authFallbackService.tryLogin.mockResolvedValue({
        id: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        name: '김지훈',
        email: 'jihoon.kim@harukok.com',
        accessToken: 'a',
        refreshToken: 'r',
        refreshTokenMaxAgeMs: 1000,
      });

      const useCase = new LoginUseCase(
        authTokenService as unknown as AuthTokenService,
        authPasswordService as unknown as AuthPasswordService,
        authFallbackService as unknown as AuthFallbackService,
        refreshTokenStore,
        usrRepository,
      );

      const result = await useCase.execute('  JIHOON.KIM@HARUKOK.COM ', '1234');

      expect(authFallbackService.tryLogin.mock.calls).toEqual([
        ['jihoon.kim@harukok.com', '1234'],
      ]);
      expect(result?.refreshToken).toBe('r');
    });

    it('비밀번호 불일치 시 실패 카운트를 반영하고 null을 반환한다', async () => {
      const user = buildUser({ failedLoginCnt: 1 });
      usrRepository.isReady.mockReturnValue(true);
      usrRepository.findActiveByEmail.mockResolvedValue(user);
      authPasswordService.verifyPassword.mockResolvedValue(false);
      usrRepository.save.mockResolvedValue(user);

      const useCase = new LoginUseCase(
        authTokenService as unknown as AuthTokenService,
        authPasswordService as unknown as AuthPasswordService,
        authFallbackService as unknown as AuthFallbackService,
        refreshTokenStore,
        usrRepository,
      );

      const result = await useCase.execute('jihoon.kim@harukok.com', 'wrong');

      expect(result).toBeNull();
      expect(user.failedLoginCnt).toBe(2);
      expect(usrRepository.save.mock.calls).toHaveLength(1);
    });

    it('로그인 성공 시 토큰 저장 및 로그인 상태를 갱신한다', async () => {
      const user = buildUser({ failedLoginCnt: 3, lockedUntil: new Date() });
      usrRepository.isReady.mockReturnValue(true);
      usrRepository.findActiveByEmail.mockResolvedValue(user);
      authPasswordService.verifyPassword.mockResolvedValue(true);
      authTokenService.issueTokenPair.mockReturnValue(issuedTokenPair);
      usrRepository.save.mockResolvedValue(user);

      const useCase = new LoginUseCase(
        authTokenService as unknown as AuthTokenService,
        authPasswordService as unknown as AuthPasswordService,
        authFallbackService as unknown as AuthFallbackService,
        refreshTokenStore,
        usrRepository,
      );

      const result = await useCase.execute(
        'jihoon.kim@harukok.com',
        'correct',
        {
          deviceName: 'iPhone',
          deviceType: DeviceType.IOS,
          ipAddress: '127.0.0.1',
        },
      );

      expect(result?.accessToken).toBe('access-token');
      expect(refreshTokenStore.upsertToken.mock.calls).toEqual([
        [
          expect.objectContaining({
            usrId: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            refreshToken: 'refresh-token',
            jti: 'jti-1',
            deviceName: 'iPhone',
            deviceType: DeviceType.IOS,
            ipAddress: '127.0.0.1',
          }),
        ],
      ]);
      expect(user.failedLoginCnt).toBe(0);
      expect(user.lockedUntil).toBeNull();
    });
  });

  describe('LogoutUseCase', () => {
    it('repository가 준비되지 않으면 fallback 로그아웃을 수행한다', async () => {
      usrRepository.isReady.mockReturnValue(false);
      authFallbackService.logout.mockResolvedValue(undefined);

      const useCase = new LogoutUseCase(
        authTokenService as unknown as AuthTokenService,
        authFallbackService as unknown as AuthFallbackService,
        refreshTokenStore,
        usrRepository,
      );

      const result = await useCase.execute('refresh-token');

      expect(result).toEqual({ ok: true });
      expect(authFallbackService.logout.mock.calls).toHaveLength(1);
    });

    it('유효한 토큰이면 저장소 토큰을 폐기한다', async () => {
      usrRepository.isReady.mockReturnValue(true);
      authTokenService.verifyRefreshToken.mockReturnValue(refreshPayload);
      usrRepository.findById.mockResolvedValue(buildUser());
      refreshTokenStore.verifyToken.mockResolvedValue(true);

      const useCase = new LogoutUseCase(
        authTokenService as unknown as AuthTokenService,
        authFallbackService as unknown as AuthFallbackService,
        refreshTokenStore,
        usrRepository,
      );

      const result = await useCase.execute('refresh-token');

      expect(result).toEqual({ ok: true });
      expect(refreshTokenStore.revokeToken.mock.calls).toEqual([
        [
          {
            usrId: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            jti: 'jti-1',
            reason: RevokeReason.LOGOUT,
          },
        ],
      ]);
    });
  });

  describe('RefreshUseCase', () => {
    it('refresh token이 없으면 null을 반환한다', async () => {
      const useCase = new RefreshUseCase(
        authTokenService as unknown as AuthTokenService,
        authFallbackService as unknown as AuthFallbackService,
        refreshTokenStore,
        usrRepository,
      );

      const result = await useCase.execute('');

      expect(result).toBeNull();
    });

    it('repository가 준비되지 않으면 fallback refresh를 사용한다', async () => {
      authTokenService.verifyRefreshToken.mockReturnValue(refreshPayload);
      usrRepository.isReady.mockReturnValue(false);
      authFallbackService.tryRefresh.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        refreshTokenMaxAgeMs: 1000,
      });

      const useCase = new RefreshUseCase(
        authTokenService as unknown as AuthTokenService,
        authFallbackService as unknown as AuthFallbackService,
        refreshTokenStore,
        usrRepository,
      );

      const result = await useCase.execute('refresh-token');

      expect(result?.accessToken).toBe('new-access');
      expect(authFallbackService.tryRefresh.mock.calls).toEqual([
        [refreshPayload, 'refresh-token'],
      ]);
    });

    it('토큰이 유효하면 새 토큰을 발급하고 저장소를 갱신한다', async () => {
      authTokenService.verifyRefreshToken.mockReturnValue(refreshPayload);
      usrRepository.isReady.mockReturnValue(true);
      usrRepository.findActiveById.mockResolvedValue(buildUser());
      refreshTokenStore.verifyToken.mockResolvedValue(true);
      authTokenService.issueTokenPair.mockReturnValue(issuedTokenPair);

      const useCase = new RefreshUseCase(
        authTokenService as unknown as AuthTokenService,
        authFallbackService as unknown as AuthFallbackService,
        refreshTokenStore,
        usrRepository,
      );

      const result = await useCase.execute('refresh-token');

      expect(result?.refreshToken).toBe('refresh-token');
      expect(refreshTokenStore.upsertToken.mock.calls).toEqual([
        [
          expect.objectContaining({
            usrId: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            refreshToken: 'refresh-token',
            jti: 'jti-1',
          }),
        ],
      ]);
    });
  });

  describe('SendEmailCodeUseCase', () => {
    it('이미 가입된 이메일이면 코드를 지우고 SIGNUP_ALREADY_EXISTS를 반환한다', async () => {
      usrRepository.isReady.mockReturnValue(true);
      usrRepository.findByEmail.mockResolvedValue(buildUser());

      const useCase = new SendEmailCodeUseCase(
        authEmailCodeService as unknown as AuthEmailCodeService,
        usrRepository,
      );

      await expect(
        resolveErrorCode(() => useCase.execute(' JIHOON.KIM@HARUKOK.COM ')),
      ).resolves.toBe(AuthErrorCode.SIGNUP_ALREADY_EXISTS);
      expect(authEmailCodeService.clearCode.mock.calls).toEqual([
        ['jihoon.kim@harukok.com'],
      ]);
    });

    it('신규 이메일이면 인증 코드를 발송한다', async () => {
      usrRepository.isReady.mockReturnValue(true);
      usrRepository.findByEmail.mockResolvedValue(null);

      const useCase = new SendEmailCodeUseCase(
        authEmailCodeService as unknown as AuthEmailCodeService,
        usrRepository,
      );

      const result = await useCase.execute(' JIHOON.KIM@HARUKOK.COM ');

      expect(result).toEqual({ ok: true });
      expect(authEmailCodeService.sendCode.mock.calls).toEqual([
        ['jihoon.kim@harukok.com'],
      ]);
    });
  });

  describe('ResendEmailCodeUseCase', () => {
    it('이미 가입된 이메일이면 재전송 대신 가입 에러를 반환한다', async () => {
      usrRepository.isReady.mockReturnValue(true);
      usrRepository.findByEmail.mockResolvedValue(buildUser());

      const useCase = new ResendEmailCodeUseCase(
        authEmailCodeService as unknown as AuthEmailCodeService,
        usrRepository,
      );

      await expect(
        resolveErrorCode(() => useCase.execute('JIHOON.KIM@HARUKOK.COM')),
      ).resolves.toBe(AuthErrorCode.SIGNUP_ALREADY_EXISTS);
      expect(authEmailCodeService.clearCode.mock.calls).toEqual([
        ['jihoon.kim@harukok.com'],
      ]);
    });

    it('미가입 이메일이면 인증 코드를 재전송한다', async () => {
      usrRepository.isReady.mockReturnValue(true);
      usrRepository.findByEmail.mockResolvedValue(null);

      const useCase = new ResendEmailCodeUseCase(
        authEmailCodeService as unknown as AuthEmailCodeService,
        usrRepository,
      );

      const result = await useCase.execute('JIHOON.KIM@HARUKOK.COM');

      expect(result).toEqual({ ok: true });
      expect(authEmailCodeService.resendCode.mock.calls).toEqual([
        ['jihoon.kim@harukok.com'],
      ]);
    });
  });

  describe('VerifyEmailCodeUseCase', () => {
    it('인증코드 검증 후 signupToken을 발급한다', async () => {
      authTokenService.issueSignupToken.mockReturnValue('signup-token');

      const useCase = new VerifyEmailCodeUseCase(
        authEmailCodeService as unknown as AuthEmailCodeService,
        authTokenService as unknown as AuthTokenService,
      );

      const result = await useCase.execute(
        ' JIHOON.KIM@HARUKOK.COM ',
        '123456',
      );

      expect(authEmailCodeService.verifyCode.mock.calls).toEqual([
        ['jihoon.kim@harukok.com', '123456'],
      ]);
      expect(authTokenService.issueSignupToken.mock.calls).toEqual([
        [
          {
            sub: 'jihoon.kim@harukok.com',
            verified: true,
            purpose: 'signup',
          },
          1800,
        ],
      ]);
      expect(result).toEqual({ ok: true, signupToken: 'signup-token' });
    });
  });

  describe('SendTemporaryPasswordUseCase', () => {
    it('repository가 준비되지 않으면 USER_REPOSITORY_NOT_READY를 던진다', async () => {
      usrRepository.isReady.mockReturnValue(false);

      const useCase = new SendTemporaryPasswordUseCase(
        authTemporaryPasswordService as unknown as AuthTemporaryPasswordService,
        usrRepository,
      );

      await expect(
        resolveErrorCode(() => useCase.execute('jihoon.kim@harukok.com')),
      ).resolves.toBe(AuthErrorCode.USER_REPOSITORY_NOT_READY);
    });

    it('EMAIL 가입 사용자면 임시 비밀번호를 전송한다', async () => {
      usrRepository.isReady.mockReturnValue(true);
      usrRepository.findByEmail.mockResolvedValue(buildUser());

      const useCase = new SendTemporaryPasswordUseCase(
        authTemporaryPasswordService as unknown as AuthTemporaryPasswordService,
        usrRepository,
      );

      const result = await useCase.execute('JIHOON.KIM@HARUKOK.COM');

      expect(result).toEqual({ ok: true });
      expect(
        authTemporaryPasswordService.sendTemporaryPassword.mock.calls,
      ).toEqual([['jihoon.kim@harukok.com']]);
    });
  });

  describe('ResetPasswordUseCase', () => {
    it('repository가 준비되지 않으면 USER_REPOSITORY_NOT_READY를 던진다', async () => {
      usrRepository.isReady.mockReturnValue(false);

      const useCase = new ResetPasswordUseCase(
        authPasswordService as unknown as AuthPasswordService,
        authTemporaryPasswordService as unknown as AuthTemporaryPasswordService,
        refreshTokenStore,
        usrRepository,
      );

      await expect(
        resolveErrorCode(() =>
          useCase.execute('jihoon.kim@harukok.com', 'temp-pass', 'new-pass'),
        ),
      ).resolves.toBe(AuthErrorCode.USER_REPOSITORY_NOT_READY);
    });

    it('존재하지 않는 사용자는 PASSWORD_RESET_USER_NOT_FOUND를 던진다', async () => {
      usrRepository.isReady.mockReturnValue(true);
      usrRepository.findByEmail.mockResolvedValue(null);

      const useCase = new ResetPasswordUseCase(
        authPasswordService as unknown as AuthPasswordService,
        authTemporaryPasswordService as unknown as AuthTemporaryPasswordService,
        refreshTokenStore,
        usrRepository,
      );

      await expect(
        resolveErrorCode(() =>
          useCase.execute('jihoon.kim@harukok.com', 'temp-pass', 'new-pass'),
        ),
      ).resolves.toBe(AuthErrorCode.PASSWORD_RESET_USER_NOT_FOUND);
    });

    it('EMAIL 가입이 아니면 PASSWORD_RESET_NOT_AVAILABLE를 던진다', async () => {
      usrRepository.isReady.mockReturnValue(true);
      usrRepository.findByEmail.mockResolvedValue(
        buildUser({ joinTypeCd: 'KAKAO' }),
      );

      const useCase = new ResetPasswordUseCase(
        authPasswordService as unknown as AuthPasswordService,
        authTemporaryPasswordService as unknown as AuthTemporaryPasswordService,
        refreshTokenStore,
        usrRepository,
      );

      await expect(
        resolveErrorCode(() =>
          useCase.execute('jihoon.kim@harukok.com', 'temp-pass', 'new-pass'),
        ),
      ).resolves.toBe(AuthErrorCode.PASSWORD_RESET_NOT_AVAILABLE);
    });

    it('성공 시 비밀번호를 갱신하고 refresh token을 폐기한다', async () => {
      const user = buildUser({
        usrStatCd: 'LOCKED',
        failedLoginCnt: 3,
        lockedUntil: new Date('2026-04-08T00:00:00.000Z'),
      });
      usrRepository.isReady.mockReturnValue(true);
      usrRepository.findByEmail.mockResolvedValue(user);
      authPasswordService.hashPassword.mockResolvedValue('new-hash');
      usrRepository.save.mockResolvedValue(user);

      const useCase = new ResetPasswordUseCase(
        authPasswordService as unknown as AuthPasswordService,
        authTemporaryPasswordService as unknown as AuthTemporaryPasswordService,
        refreshTokenStore,
        usrRepository,
      );

      const result = await useCase.execute(
        'JIHOON.KIM@HARUKOK.COM',
        'temp-pass',
        'new-pass',
      );

      expect(result).toEqual({ ok: true });
      expect(user.pwd).toBe('new-hash');
      expect(user.pwdHash).toBe('argon2id');
      expect(user.usrStatCd).toBe('ACTIVE');
      expect(user.failedLoginCnt).toBe(0);
      expect(user.lockedUntil).toBeNull();
      expect(refreshTokenStore.revokeToken.mock.calls).toEqual([
        [
          {
            usrId: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            reason: RevokeReason.PASSWORD_CHANGE,
          },
        ],
      ]);
      expect(
        authTemporaryPasswordService.verifyAndConsumeTemporaryPassword.mock
          .calls,
      ).toEqual([['jihoon.kim@harukok.com', 'temp-pass']]);
    });

    it('저장 중 오류가 발생하면 PASSWORD_RESET_SAVE_FAILED를 던진다', async () => {
      usrRepository.isReady.mockReturnValue(true);
      usrRepository.findByEmail.mockResolvedValue(buildUser());
      authPasswordService.hashPassword.mockResolvedValue('new-hash');
      usrRepository.save.mockRejectedValue(new Error('db error'));

      const useCase = new ResetPasswordUseCase(
        authPasswordService as unknown as AuthPasswordService,
        authTemporaryPasswordService as unknown as AuthTemporaryPasswordService,
        refreshTokenStore,
        usrRepository,
      );

      await expect(
        resolveErrorCode(() =>
          useCase.execute('jihoon.kim@harukok.com', 'temp-pass', 'new-pass'),
        ),
      ).resolves.toBe(AuthErrorCode.PASSWORD_RESET_SAVE_FAILED);
    });

    it('토큰 폐기 중 오류가 발생하면 PASSWORD_RESET_SAVE_FAILED를 던진다', async () => {
      usrRepository.isReady.mockReturnValue(true);
      usrRepository.findByEmail.mockResolvedValue(buildUser());
      authPasswordService.hashPassword.mockResolvedValue('new-hash');
      usrRepository.save.mockResolvedValue(buildUser());
      refreshTokenStore.revokeToken.mockRejectedValue(new Error('redis error'));

      const useCase = new ResetPasswordUseCase(
        authPasswordService as unknown as AuthPasswordService,
        authTemporaryPasswordService as unknown as AuthTemporaryPasswordService,
        refreshTokenStore,
        usrRepository,
      );

      await expect(
        resolveErrorCode(() =>
          useCase.execute('jihoon.kim@harukok.com', 'temp-pass', 'new-pass'),
        ),
      ).resolves.toBe(AuthErrorCode.PASSWORD_RESET_SAVE_FAILED);
    });
  });

  describe('SignupUseCase', () => {
    it('signupToken이 유효하지 않으면 SIGNUP_TOKEN_INVALID를 던진다', async () => {
      authTokenService.verifySignupToken.mockReturnValue(null);

      const useCase = new SignupUseCase(
        authTokenService as unknown as AuthTokenService,
        authPasswordService as unknown as AuthPasswordService,
        usrRepository,
      );

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            'jihoon.kim@harukok.com',
            'pass',
            '김지훈',
            'bad-token',
          ),
        ),
      ).resolves.toBe(AuthErrorCode.SIGNUP_TOKEN_INVALID);
    });

    it('토큰 payload 형식이 잘못되면 SIGNUP_TOKEN_FORMAT_INVALID를 던진다', async () => {
      authTokenService.verifySignupToken.mockReturnValue({
        sub: 'jihoon.kim@harukok.com',
        verified: false,
        purpose: 'signup',
      });

      const useCase = new SignupUseCase(
        authTokenService as unknown as AuthTokenService,
        authPasswordService as unknown as AuthPasswordService,
        usrRepository,
      );

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            'jihoon.kim@harukok.com',
            'pass',
            '김지훈',
            'bad-payload',
          ),
        ),
      ).resolves.toBe(AuthErrorCode.SIGNUP_TOKEN_FORMAT_INVALID);
    });

    it('이메일이 토큰과 다르면 SIGNUP_EMAIL_MISMATCH를 던진다', async () => {
      authTokenService.verifySignupToken.mockReturnValue({
        sub: 'mina.lee@harukok.com',
        verified: true,
        purpose: 'signup',
      });

      const useCase = new SignupUseCase(
        authTokenService as unknown as AuthTokenService,
        authPasswordService as unknown as AuthPasswordService,
        usrRepository,
      );

      await expect(
        resolveErrorCode(() =>
          useCase.execute('jihoon.kim@harukok.com', 'pass', '김지훈', 'token'),
        ),
      ).resolves.toBe(AuthErrorCode.SIGNUP_EMAIL_MISMATCH);
    });

    it('성공 시 정규화된 값으로 사용자를 생성한다', async () => {
      usrRepository.isReady.mockReturnValue(true);
      authTokenService.verifySignupToken.mockReturnValue({
        sub: 'jihoon.kim@harukok.com',
        verified: true,
        purpose: 'signup',
      });
      usrRepository.findByEmail.mockResolvedValue(null);
      authPasswordService.hashPassword.mockResolvedValue('hashed-password');
      usrRepository.createAndSave.mockResolvedValue(
        buildUser({
          usrEmail: 'jihoon.kim@harukok.com',
          usrNm: '김지훈',
          pwd: 'hashed-password',
        }),
      );

      const useCase = new SignupUseCase(
        authTokenService as unknown as AuthTokenService,
        authPasswordService as unknown as AuthPasswordService,
        usrRepository,
      );

      const result = await useCase.execute(
        ' JIHOON.KIM@HARUKOK.COM ',
        'pass',
        '  김지훈  ',
        'token',
      );

      expect(result).toEqual({
        id: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        email: 'jihoon.kim@harukok.com',
        name: '김지훈',
      });
      expect(usrRepository.createAndSave.mock.calls).toEqual([
        [
          {
            usrEmail: 'jihoon.kim@harukok.com',
            usrNm: '김지훈',
            pwd: 'hashed-password',
            pwdHash: 'argon2id',
            joinTypeCd: 'EMAIL',
          },
        ],
      ]);
    });

    it('중복 키 에러면 SIGNUP_ALREADY_EXISTS를 던진다', async () => {
      usrRepository.isReady.mockReturnValue(true);
      authTokenService.verifySignupToken.mockReturnValue({
        sub: 'jihoon.kim@harukok.com',
        verified: true,
        purpose: 'signup',
      });
      usrRepository.findByEmail.mockResolvedValue(null);
      authPasswordService.hashPassword.mockResolvedValue('hashed-password');
      usrRepository.createAndSave.mockRejectedValue(
        new QueryFailedError(
          'insert',
          [],
          Object.assign(new Error('duplicate'), { code: '23505' }),
        ),
      );

      const useCase = new SignupUseCase(
        authTokenService as unknown as AuthTokenService,
        authPasswordService as unknown as AuthPasswordService,
        usrRepository,
      );

      await expect(
        resolveErrorCode(() =>
          useCase.execute('jihoon.kim@harukok.com', 'pass', '김지훈', 'token'),
        ),
      ).resolves.toBe(AuthErrorCode.SIGNUP_ALREADY_EXISTS);
    });

    it('저장 실패는 SIGNUP_SAVE_FAILED를 던진다', async () => {
      usrRepository.isReady.mockReturnValue(true);
      authTokenService.verifySignupToken.mockReturnValue({
        sub: 'jihoon.kim@harukok.com',
        verified: true,
        purpose: 'signup',
      });
      usrRepository.findByEmail.mockResolvedValue(null);
      authPasswordService.hashPassword.mockResolvedValue('hashed-password');
      usrRepository.createAndSave.mockRejectedValue(new Error('db error'));

      const useCase = new SignupUseCase(
        authTokenService as unknown as AuthTokenService,
        authPasswordService as unknown as AuthPasswordService,
        usrRepository,
      );

      await expect(
        resolveErrorCode(() =>
          useCase.execute('jihoon.kim@harukok.com', 'pass', '김지훈', 'token'),
        ),
      ).resolves.toBe(AuthErrorCode.SIGNUP_SAVE_FAILED);
    });
  });
});
