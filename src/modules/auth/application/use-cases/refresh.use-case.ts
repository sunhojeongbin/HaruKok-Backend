import { Inject, Injectable } from '@nestjs/common';
import { AuthFallbackService } from '../../services/auth-fallback.service';
import { AuthRefreshTokenStoreService } from '../../services/rft-store.service';
import { AuthTokenService } from '../../services/auth-token.service';
import { RefreshResult } from '../../types/auth.types';
import {
  USR_REPOSITORY,
  UsrRepositoryPort,
} from '../../../usr/repositories/usr.repository.port';

@Injectable()
export class RefreshUseCase {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly authFallbackService: AuthFallbackService,
    private readonly refreshTokenStore: AuthRefreshTokenStoreService,
    @Inject(USR_REPOSITORY)
    private readonly usrRepository: UsrRepositoryPort,
  ) {}

  execute(refreshToken: string): Promise<RefreshResult | null> {
    return this.refresh(refreshToken);
  }

  private async refresh(refreshToken: string): Promise<RefreshResult | null> {
    if (!refreshToken) {
      return null;
    }

    const payload = this.authTokenService.verifyRefreshToken(refreshToken);
    if (!payload) {
      return null;
    }

    if (!this.usrRepository.isReady()) {
      return this.authFallbackService.tryRefresh(payload, refreshToken);
    }

    const user = await this.usrRepository.findActiveById(payload.sub);
    if (!user) {
      return null;
    }

    const isValidRefreshToken = await this.refreshTokenStore.verifyToken({
      usrId: user.usrId,
      refreshToken,
      jti: payload.jti,
    });
    if (!isValidRefreshToken) {
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
      lastUsedAt: new Date(),
    });

    return tokenPair;
  }
}
