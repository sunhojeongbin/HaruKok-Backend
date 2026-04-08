import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { unlockAndResetLoginAttemptStatePolicy } from '../../domain/policies/auth-login-attempt.policy';
import { normalizeAuthEmail } from '../../domain/policies/auth-normalization.policy';
import { RevokeReason } from '../../enums/refresh-token.enum';
import { AuthErrorCode } from '../../errors/auth-error-code';
import { AuthPasswordService } from '../../services/auth-password.service';
import { AuthTemporaryPasswordService } from '../../services/auth-temporary-password.service';
import { AuthRefreshTokenStoreService } from '../../services/rft-store.service';
import {
  USR_REPOSITORY,
  UsrRepositoryPort,
} from '../../../usr/repositories/usr.repository.port';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly authPasswordService: AuthPasswordService,
    private readonly authTemporaryPasswordService: AuthTemporaryPasswordService,
    private readonly refreshTokenStore: AuthRefreshTokenStoreService,
    @Inject(USR_REPOSITORY)
    private readonly usrRepository: UsrRepositoryPort,
  ) {}

  private getUsrRepository(): UsrRepositoryPort {
    if (!this.usrRepository.isReady()) {
      throw new BusinessException(AuthErrorCode.USER_REPOSITORY_NOT_READY);
    }
    return this.usrRepository;
  }

  async execute(
    email: string,
    temporaryPassword: string,
    newPassword: string,
  ): Promise<{ ok: true }> {
    const normalizedEmail = normalizeAuthEmail(email);
    const repo = this.getUsrRepository();
    const user = await repo.findByEmail(normalizedEmail);

    if (!user) {
      throw new BusinessException(AuthErrorCode.PASSWORD_RESET_USER_NOT_FOUND);
    }

    if (user.joinTypeCd !== 'EMAIL') {
      throw new BusinessException(AuthErrorCode.PASSWORD_RESET_NOT_AVAILABLE);
    }

    this.authTemporaryPasswordService.verifyTemporaryPasswordWithoutConsuming(
      normalizedEmail,
      temporaryPassword,
    );

    const hashedPassword =
      await this.authPasswordService.hashPassword(newPassword);
    user.pwd = hashedPassword;
    user.pwdHash = this.authPasswordService.algorithm;
    unlockAndResetLoginAttemptStatePolicy(user);

    try {
      await repo.save(user);
      await this.refreshTokenStore.revokeToken(
        user.usrId,
        RevokeReason.PASSWORD_CHANGE,
      );
      this.authTemporaryPasswordService.consumeTemporaryPassword(
        normalizedEmail,
      );
      return { ok: true };
    } catch {
      throw new BusinessException(AuthErrorCode.PASSWORD_RESET_SAVE_FAILED);
    }
  }
}
