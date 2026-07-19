import { BusinessException } from '../../../../common/exceptions/business.exception';
import { UsrEntity } from '../../../usr/entities/usr.entity';
import { UsrSocialEntity } from '../../../usr/entities/usr-social.entity';
import { UsrRepositoryPort } from '../../../usr/repositories/usr.repository.port';
import { UsrSocialRepositoryPort } from '../../../usr/repositories/usr-social.repository.port';
import { AuthErrorCode } from '../../errors/auth-error-code';
import { IssuedTokenPair } from '../../types/auth.types';
import { AuthRefreshTokenStoreService } from '../../services/rft-store.service';
import { AuthTokenService } from '../../services/auth-token.service';
import {
  KakaoAuthService,
  KakaoUserProfile,
} from '../../services/kakao-auth.service';
import { KakaoLoginUseCase } from './kakao-login.use-case';

function buildUsrEntity(overrides: Partial<UsrEntity> = {}): UsrEntity {
  const now = new Date('2026-04-29T00:00:00.000Z');
  return {
    usrId: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
    usrEmail: null,
    usrNm: '카카오사용자',
    pwd: null,
    pwdHash: null,
    joinTypeCd: 'KAKAO',
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

function buildUsrSocialEntity(
  overrides: Partial<UsrSocialEntity> = {},
): UsrSocialEntity {
  const now = new Date('2026-04-29T00:00:00.000Z');
  return {
    socialId: 'a1b2c3d4-0000-0000-0000-000000000000',
    usrId: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
    providerCd: 'KAKAO',
    providerUid: 'kakao-uid-123',
    providerEmail: null,
    connectedAt: now,
    lastLoginAt: null,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    usr: buildUsrEntity(),
    ...overrides,
  };
}

function buildTokenPair(): IssuedTokenPair {
  return {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    refreshTokenMaxAgeMs: 2_592_000_000,
    jti: 'jti-123',
    refreshTokenExpiresAt: new Date('2026-05-29T00:00:00.000Z'),
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

describe('KakaoLoginUseCase', () => {
  const ACCESS_TOKEN = 'valid-kakao-access-token';
  // 이메일 미제공 프로필 (카카오 기본)
  const PROFILE_NO_EMAIL: KakaoUserProfile = {
    providerUid: 'kakao-uid-123',
    email: null,
    name: '카카오사용자',
  };
  // 이메일 제공 프로필
  const PROFILE_WITH_EMAIL: KakaoUserProfile = {
    providerUid: 'kakao-uid-123',
    email: 'user@kakao.com',
    name: '홍길동',
  };

  let kakaoAuthService: jest.Mocked<Pick<KakaoAuthService, 'verify'>>;
  let authTokenService: jest.Mocked<Pick<AuthTokenService, 'issueTokenPair'>>;
  let refreshTokenStore: jest.Mocked<
    Pick<AuthRefreshTokenStoreService, 'upsertToken'>
  >;
  let usrRepository: jest.Mocked<UsrRepositoryPort>;
  let usrSocialRepository: jest.Mocked<UsrSocialRepositoryPort>;

  beforeEach(() => {
    kakaoAuthService = {
      verify: jest.fn().mockResolvedValue(PROFILE_NO_EMAIL),
    };
    authTokenService = {
      issueTokenPair: jest.fn().mockReturnValue(buildTokenPair()),
    };
    refreshTokenStore = {
      upsertToken: jest.fn().mockResolvedValue(undefined),
    };
    usrRepository = {
      isReady: jest.fn().mockReturnValue(true),
      findByEmail: jest.fn().mockResolvedValue(null),
      findActiveByEmail: jest.fn(),
      findById: jest.fn(),
      findActiveById: jest.fn(),
      countAcceptedFrds: jest.fn(),
      getTodoDashboardMetrics: jest.fn(),
      createAndSave: jest.fn(),
      save: jest
        .fn()
        .mockImplementation((usr: UsrEntity) => Promise.resolve(usr)),
      hardDeleteById: jest.fn(),
    };
    usrSocialRepository = {
      isReady: jest.fn().mockReturnValue(true),
      findActiveByProvider: jest.fn().mockResolvedValue(null),
      linkSocialToUser: jest.fn(),
      createUserWithSocial: jest.fn(),
      touchLastLogin: jest.fn().mockResolvedValue(undefined),
    };
  });

  function makeUseCase(): KakaoLoginUseCase {
    return new KakaoLoginUseCase(
      kakaoAuthService as unknown as KakaoAuthService,
      authTokenService as unknown as AuthTokenService,
      refreshTokenStore as unknown as AuthRefreshTokenStoreService,
      usrRepository,
      usrSocialRepository,
    );
  }

  it('기존 소셜 연동 사용자면 조회한 사용자로 토큰을 발급한다', async () => {
    const social = buildUsrSocialEntity();
    const user = buildUsrEntity();
    usrSocialRepository.findActiveByProvider.mockResolvedValue(social);
    usrRepository.findActiveById.mockResolvedValue(user);

    const result = await makeUseCase().execute(ACCESS_TOKEN);

    expect(result).toMatchObject({
      id: user.usrId,
      name: user.usrNm,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usrSocialRepository.createUserWithSocial).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usrSocialRepository.linkSocialToUser).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usrSocialRepository.touchLastLogin).toHaveBeenCalledWith(social);
    expect(authTokenService.issueTokenPair).toHaveBeenCalledWith({
      sub: user.usrId,
      email: '',
    });
    expect(refreshTokenStore.upsertToken).toHaveBeenCalledWith(
      expect.objectContaining({ usrId: user.usrId, jti: 'jti-123' }),
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usrRepository.save).toHaveBeenCalled();
  });

  it('이메일 미제공 신규 사용자는 이메일 없이 자동가입한다', async () => {
    const createdUser = buildUsrEntity({ usrId: 'new-user-id' });
    kakaoAuthService.verify.mockResolvedValue(PROFILE_NO_EMAIL);
    usrSocialRepository.findActiveByProvider.mockResolvedValue(null);
    usrSocialRepository.createUserWithSocial.mockResolvedValue({
      usr: createdUser,
      social: buildUsrSocialEntity({ usrId: 'new-user-id' }),
    });

    const result = await makeUseCase().execute(ACCESS_TOKEN);

    expect(result.id).toBe('new-user-id');
    // 이메일이 없으므로 이메일 기반 조회는 하지 않는다
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usrRepository.findByEmail).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usrSocialRepository.createUserWithSocial).toHaveBeenCalledWith({
      usrEmail: null,
      usrNm: PROFILE_NO_EMAIL.name,
      providerCd: 'KAKAO',
      providerUid: PROFILE_NO_EMAIL.providerUid,
      providerEmail: null,
    });
  });

  it('이메일 제공 시 동일 이메일의 기존 계정이 있으면 소셜 연동만 추가한다', async () => {
    const existingUser = buildUsrEntity({
      usrId: 'existing-user-id',
      usrEmail: 'user@kakao.com',
      joinTypeCd: 'EMAIL',
      usrNm: '기존회원',
    });
    kakaoAuthService.verify.mockResolvedValue(PROFILE_WITH_EMAIL);
    usrSocialRepository.findActiveByProvider.mockResolvedValue(null);
    usrRepository.findByEmail.mockResolvedValue(existingUser);
    usrSocialRepository.linkSocialToUser.mockResolvedValue(
      buildUsrSocialEntity({ usrId: 'existing-user-id' }),
    );

    const result = await makeUseCase().execute(ACCESS_TOKEN);

    expect(result.id).toBe('existing-user-id');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usrSocialRepository.linkSocialToUser).toHaveBeenCalledWith({
      usrId: 'existing-user-id',
      providerCd: 'KAKAO',
      providerUid: PROFILE_WITH_EMAIL.providerUid,
      providerEmail: 'user@kakao.com',
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usrSocialRepository.createUserWithSocial).not.toHaveBeenCalled();
  });

  it('카카오 토큰 검증에 실패하면 KAKAO_TOKEN_INVALID를 던진다', async () => {
    kakaoAuthService.verify.mockRejectedValue(
      new BusinessException(AuthErrorCode.KAKAO_TOKEN_INVALID),
    );

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(ACCESS_TOKEN),
    );

    expect(code).toBe(AuthErrorCode.KAKAO_TOKEN_INVALID);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usrSocialRepository.findActiveByProvider).not.toHaveBeenCalled();
  });

  it('리포지토리가 준비되지 않았으면 USER_REPOSITORY_NOT_READY를 던진다', async () => {
    usrSocialRepository.isReady.mockReturnValue(false);

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(ACCESS_TOKEN),
    );

    expect(code).toBe(AuthErrorCode.USER_REPOSITORY_NOT_READY);
  });

  it('신규 사용자 저장에 실패하면 KAKAO_SAVE_FAILED를 던진다', async () => {
    usrSocialRepository.findActiveByProvider.mockResolvedValue(null);
    usrSocialRepository.createUserWithSocial.mockRejectedValue(
      new Error('db error'),
    );

    const code = await resolveErrorCode(() =>
      makeUseCase().execute(ACCESS_TOKEN),
    );

    expect(code).toBe(AuthErrorCode.KAKAO_SAVE_FAILED);
    expect(refreshTokenStore.upsertToken).not.toHaveBeenCalled();
  });
});
