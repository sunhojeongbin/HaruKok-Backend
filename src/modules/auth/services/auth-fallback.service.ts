import { Injectable } from '@nestjs/common';
import { RevokeReason } from '../enums/refresh-token.enum';
import { AuthRefreshTokenStoreService } from './rft-store.service';
import { AuthTokenService } from './auth-token.service';
import {
  LoginResult,
  RefreshResult,
  TokenPayload,
  UserInfo,
} from '../types/auth.types';

@Injectable()
export class AuthFallbackService {
  private readonly fallbackUser = {
    email: 'test@gmail.com',
    password: '1234',
    id: '00000000-0000-0000-0000-000000000001',
    name: '홍길동',
  };

  private readonly allowFallbackUser =
    process.env.AUTH_FALLBACK_ENABLED === 'true';

  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly refreshTokenStore: AuthRefreshTokenStoreService,
  ) {}

  /** @description AUTH_FALLBACK_ENABLED=true 일 때 fallback 로그인 사용자 허용 여부를 반환한다. */
  isEnabled(): boolean {
    return this.allowFallbackUser;
  }

  /** @description DB 비활성화 테스트 환경용 fallback 로그인 처리 */
  async tryLogin(
    normalizedEmail: string,
    password: string,
  ): Promise<LoginResult | null> {
    if (!this.allowFallbackUser) {
      return null;
    }

    if (
      normalizedEmail !== this.fallbackUser.email ||
      password !== this.fallbackUser.password
    ) {
      return null;
    }

    const tokenPair = this.authTokenService.issueTokenPair({
      sub: this.fallbackUser.id,
      email: this.fallbackUser.email,
    });
    await this.refreshTokenStore.upsertToken({
      usrId: this.fallbackUser.id,
      refreshToken: tokenPair.refreshToken,
      jti: tokenPair.jti,
      expiresAt: tokenPair.refreshTokenExpiresAt,
      deviceName: 'fallback',
      deviceType: null,
      ipAddress: null,
      lastUsedAt: null,
    });

    return {
      id: this.fallbackUser.id,
      name: this.fallbackUser.name,
      email: this.fallbackUser.email,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      refreshTokenMaxAgeMs: tokenPair.refreshTokenMaxAgeMs,
    };
  }

  /** @description DB 비활성화 테스트 환경용 fallback 토큰 재발급 처리 */
  async tryRefresh(
    payload: TokenPayload,
    refreshToken: string,
  ): Promise<RefreshResult | null> {
    if (!this.allowFallbackUser) {
      return null;
    }

    if (payload.sub !== this.fallbackUser.id) {
      return null;
    }

    const isValid = await this.refreshTokenStore.verifyToken({
      usrId: this.fallbackUser.id,
      refreshToken,
      jti: payload.jti,
    });
    if (!isValid) {
      return null;
    }

    const tokenPair = this.authTokenService.issueTokenPair({
      sub: this.fallbackUser.id,
      email: this.fallbackUser.email,
    });
    await this.refreshTokenStore.upsertToken({
      usrId: this.fallbackUser.id,
      refreshToken: tokenPair.refreshToken,
      jti: tokenPair.jti,
      expiresAt: tokenPair.refreshTokenExpiresAt,
      deviceName: 'fallback',
      deviceType: null,
      ipAddress: null,
      lastUsedAt: new Date(),
    });
    return tokenPair;
  }

  /** @description DB 비활성화 테스트 환경용 fallback 로그아웃 처리 */
  async logout(): Promise<void> {
    if (!this.allowFallbackUser) {
      return;
    }
    await this.refreshTokenStore.revokeToken({
      usrId: this.fallbackUser.id,
      reason: RevokeReason.LOGOUT,
    });
  }

  /** @description DB 비활성화 테스트 환경용 fallback 사용자 조회 */
  getUserById(userId: string): UserInfo | null {
    if (!this.allowFallbackUser || userId !== this.fallbackUser.id) {
      return null;
    }

    return {
      id: this.fallbackUser.id,
      name: this.fallbackUser.name,
      email: this.fallbackUser.email,
      frdCnt: 0,
    };
  }
}
