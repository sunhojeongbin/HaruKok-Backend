import { Inject, Injectable } from '@nestjs/common';
import {
  applyFailedLoginAttemptPolicy,
  resetLoginAttemptStatePolicy,
} from '../../domain/policies/auth-login-attempt.policy';
import { normalizeAuthEmail } from '../../domain/policies/auth-normalization.policy';
import { DeviceType } from '../../enums/refresh-token.enum';
import { LoginResult } from '../../types/auth.types';
import { AuthFallbackService } from '../../services/auth-fallback.service';
import { AuthPasswordService } from '../../services/auth-password.service';
import { AuthRefreshTokenStoreService } from '../../services/rft-store.service';
import { AuthTokenService } from '../../services/auth-token.service';
import {
  USR_REPOSITORY,
  UsrRepositoryPort,
} from '../../../usr/repositories/usr.repository.port';

type LoginContext = {
  deviceName?: string | null;
  deviceType?: DeviceType | null;
  ipAddress?: string | null;
};

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly authPasswordService: AuthPasswordService,
    private readonly authFallbackService: AuthFallbackService,
    private readonly refreshTokenStore: AuthRefreshTokenStoreService,
    @Inject(USR_REPOSITORY)
    private readonly usrRepository: UsrRepositoryPort,
  ) {}

  private readonly maxFailedLoginCount = this.getPositiveIntFromEnv(
    'AUTH_MAX_FAILED_LOGIN_COUNT',
    5,
  );
  private readonly lockDurationMinutes = this.getPositiveIntFromEnv(
    'AUTH_LOCK_DURATION_MINUTES',
    30,
  );

  private getPositiveIntFromEnv(key: string, fallback: number): number {
    const raw = process.env[key]?.trim();
    if (!raw) {
      return fallback;
    }

    const value = Number(raw);
    if (!Number.isInteger(value) || value <= 0) {
      return fallback;
    }

    return value;
  }

  execute(
    email: string,
    password: string,
    context: LoginContext = {},
  ): Promise<LoginResult | null> {
    return this.login(email, password, context);
  }

  private async login(
    email: string,
    password: string,
    context: LoginContext = {},
  ): Promise<LoginResult | null> {
    const normalizedEmail = normalizeAuthEmail(email);

    if (!this.usrRepository.isReady()) {
      return this.authFallbackService.tryLogin(normalizedEmail, password);
    }

    const user = await this.usrRepository.findActiveByEmail(normalizedEmail);
    if (!user) {
      return null;
    }

    const passwordMatched = await this.authPasswordService.verifyPassword(
      user.pwd,
      user.pwdHash,
      password,
    );
    if (!passwordMatched) {
      applyFailedLoginAttemptPolicy(user, {
        maxFailedLoginCount: this.maxFailedLoginCount,
        lockDurationMinutes: this.lockDurationMinutes,
      });
      await this.usrRepository.save(user);
      return null;
    }

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
    resetLoginAttemptStatePolicy(user);
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
}
