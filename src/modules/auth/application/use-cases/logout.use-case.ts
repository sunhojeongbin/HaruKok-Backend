import { Inject, Injectable } from '@nestjs/common';
import { RevokeReason } from '../../enums/refresh-token.enum';
import { AuthFallbackService } from '../../services/auth-fallback.service';
import { AuthRefreshTokenStoreService } from '../../services/rft-store.service';
import { AuthTokenService } from '../../services/auth-token.service';
import {
  USR_REPOSITORY,
  UsrRepositoryPort,
} from '../../../usr/repositories/usr.repository.port';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly authFallbackService: AuthFallbackService,
    private readonly refreshTokenStore: AuthRefreshTokenStoreService,
    @Inject(USR_REPOSITORY)
    private readonly usrRepository: UsrRepositoryPort,
  ) {}

  execute(refreshToken: string | null): Promise<{ ok: boolean }> {
    return this.logout(refreshToken);
  }

  private async logout(refreshToken: string | null): Promise<{ ok: true }> {
    if (!this.usrRepository.isReady()) {
      await this.authFallbackService.logout();
      return { ok: true };
    }

    if (!refreshToken) {
      return { ok: true };
    }

    const payload = this.authTokenService.verifyRefreshToken(refreshToken);
    if (!payload) {
      return { ok: true };
    }

    const user = await this.usrRepository.findById(payload.sub);
    if (!user) {
      return { ok: true };
    }

    const isValidRefreshToken = await this.refreshTokenStore.verifyToken({
      usrId: user.usrId,
      refreshToken,
      jti: payload.jti,
    });
    if (!isValidRefreshToken) {
      return { ok: true };
    }

    await this.refreshTokenStore.revokeToken({
      usrId: user.usrId,
      jti: payload.jti,
      reason: RevokeReason.LOGOUT,
    });
    return { ok: true };
  }
}
