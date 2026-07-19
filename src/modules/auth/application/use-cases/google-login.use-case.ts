import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { normalizeAuthEmail } from '../../domain/policies/auth-normalization.policy';
import { DeviceType } from '../../enums/refresh-token.enum';
import { AuthErrorCode } from '../../errors/auth-error-code';
import { GoogleAuthService } from '../../services/google-auth.service';
import { AuthRefreshTokenStoreService } from '../../services/rft-store.service';
import { AuthTokenService } from '../../services/auth-token.service';
import { LoginResult } from '../../types/auth.types';
import { UsrEntity } from '../../../usr/entities/usr.entity';
import { UsrSocialEntity } from '../../../usr/entities/usr-social.entity';
import {
  USR_REPOSITORY,
  UsrRepositoryPort,
} from '../../../usr/repositories/usr.repository.port';
import {
  USR_SOCIAL_REPOSITORY,
  UsrSocialRepositoryPort,
} from '../../../usr/repositories/usr-social.repository.port';

const GOOGLE_PROVIDER_CD = 'GOOGLE';

type GoogleLoginContext = {
  deviceName?: string | null;
  deviceType?: DeviceType | null;
  ipAddress?: string | null;
};

@Injectable()
export class GoogleLoginUseCase {
  constructor(
    private readonly googleAuthService: GoogleAuthService,
    private readonly authTokenService: AuthTokenService,
    private readonly refreshTokenStore: AuthRefreshTokenStoreService,
    @Inject(USR_REPOSITORY)
    private readonly usrRepository: UsrRepositoryPort,
    @Inject(USR_SOCIAL_REPOSITORY)
    private readonly usrSocialRepository: UsrSocialRepositoryPort,
  ) {}

  execute(
    idToken: string,
    context: GoogleLoginContext = {},
  ): Promise<LoginResult> {
    return this.login(idToken, context);
  }

  private async login(
    idToken: string,
    context: GoogleLoginContext,
  ): Promise<LoginResult> {
    const profile = await this.googleAuthService.verify(idToken);

    if (!this.usrRepository.isReady() || !this.usrSocialRepository.isReady()) {
      throw new BusinessException(AuthErrorCode.USER_REPOSITORY_NOT_READY);
    }

    const normalizedEmail = normalizeAuthEmail(profile.email);
    const user = await this.resolveUser(profile, normalizedEmail);

    const tokenPair = this.authTokenService.issueTokenPair({
      sub: user.usrId,
      email: user.usrEmail ?? '',
    });
    await this.refreshTokenStore.upsertToken({
      usrId: user.usrId,
      refreshToken: tokenPair.refreshToken,
      jti: tokenPair.jti,
      expiresAt: tokenPair.refreshTokenExpiresAt,
      deviceName: context.deviceName ?? null,
      deviceType: context.deviceType ?? null,
      ipAddress: context.ipAddress ?? null,
      lastUsedAt: null,
    });

    user.lastLoginAt = new Date();
    await this.usrRepository.save(user);

    return {
      id: user.usrId,
      name: user.usrNm,
      email: user.usrEmail ?? '',
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      refreshTokenMaxAgeMs: tokenPair.refreshTokenMaxAgeMs,
    };
  }

  /**
   * @description 소셜 연동 이력을 기준으로 사용자를 조회하거나,
   * 신규 자동가입/기존 계정 자동연동을 처리해 사용자를 반환한다.
   */
  private async resolveUser(
    profile: { providerUid: string; email: string; name: string },
    normalizedEmail: string,
  ): Promise<UsrEntity> {
    const existingSocial = await this.usrSocialRepository.findActiveByProvider(
      GOOGLE_PROVIDER_CD,
      profile.providerUid,
    );

    // 4a. 기존 소셜 연동 사용자
    if (existingSocial) {
      const user = await this.usrRepository.findActiveById(
        existingSocial.usrId,
      );
      if (!user) {
        throw new BusinessException(AuthErrorCode.USER_NOT_FOUND);
      }
      await this.touchSocialLastLogin(existingSocial);
      return user;
    }

    // 4b. 이메일 충돌 → 기존 계정 자동 연동
    const existingUser = await this.usrRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      await this.runPersistence(() =>
        this.usrSocialRepository.linkSocialToUser({
          usrId: existingUser.usrId,
          providerCd: GOOGLE_PROVIDER_CD,
          providerUid: profile.providerUid,
          providerEmail: profile.email,
        }),
      );
      return existingUser;
    }

    // 4c. 신규 자동가입
    const created = await this.runPersistence(() =>
      this.usrSocialRepository.createUserWithSocial({
        usrEmail: normalizedEmail,
        usrNm: profile.name,
        providerCd: GOOGLE_PROVIDER_CD,
        providerUid: profile.providerUid,
        providerEmail: profile.email,
      }),
    );
    return created.usr;
  }

  private async touchSocialLastLogin(social: UsrSocialEntity): Promise<void> {
    try {
      await this.usrSocialRepository.touchLastLogin(social);
    } catch {
      // 마지막 로그인 시각 갱신 실패는 로그인 자체를 막지 않는다.
    }
  }

  private async runPersistence<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException(AuthErrorCode.GOOGLE_SAVE_FAILED);
    }
  }
}
