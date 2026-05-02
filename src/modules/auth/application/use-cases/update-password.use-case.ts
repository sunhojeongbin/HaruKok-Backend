import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { unlockAndResetLoginAttemptStatePolicy } from '../../domain/policies/auth-login-attempt.policy';
import { RevokeReason } from '../../enums/refresh-token.enum';
import { AuthErrorCode } from '../../errors/auth-error-code';
import { AuthPasswordService } from '../../services/auth-password.service';
import { AuthRefreshTokenStoreService } from '../../services/rft-store.service';
import {
  USR_REPOSITORY,
  UsrRepositoryPort,
} from '../../../usr/repositories/usr.repository.port';

@Injectable()
export class UpdatePasswordUseCase {
  constructor(
    private readonly authPasswordService: AuthPasswordService,
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
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ ok: true }> {
    const repo = this.getUsrRepository();
    const user = await repo.findActiveById(userId);

    if (!user) {
      throw new BusinessException(AuthErrorCode.USER_NOT_FOUND);
    }

    if (user.joinTypeCd !== 'EMAIL') {
      throw new BusinessException(AuthErrorCode.UPDATE_PASSWORD_NOT_AVAILABLE);
    }

    const isCurrentValid = await this.authPasswordService.verifyPassword(
      user.pwd,
      user.pwdHash,
      currentPassword,
    );
    if (!isCurrentValid) {
      throw new BusinessException(AuthErrorCode.UPDATE_PASSWORD_WRONG_CURRENT);
    }

    const isSameAsNew = await this.authPasswordService.verifyPassword(
      user.pwd,
      user.pwdHash,
      newPassword,
    );
    if (isSameAsNew) {
      throw new BusinessException(
        AuthErrorCode.UPDATE_PASSWORD_SAME_AS_CURRENT,
      );
    }

    const hashedPassword =
      await this.authPasswordService.hashPassword(newPassword);
    user.pwd = hashedPassword;
    user.pwdHash = this.authPasswordService.algorithm;
    unlockAndResetLoginAttemptStatePolicy(user);

    try {
      await repo.save(user);
    } catch {
      throw new BusinessException(AuthErrorCode.UPDATE_PASSWORD_SAVE_FAILED);
    }

    try {
      await this.refreshTokenStore.revokeToken({
        usrId: userId,
        reason: RevokeReason.PASSWORD_CHANGE,
      });
    } catch {
      throw new BusinessException(AuthErrorCode.UPDATE_PASSWORD_SAVE_FAILED);
    }

    return { ok: true };
  }
}
