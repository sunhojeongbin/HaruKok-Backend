import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { normalizeAuthEmail } from '../../domain/policies/auth-normalization.policy';
import { AuthErrorCode } from '../../errors/auth-error-code';
import { AuthTemporaryPasswordService } from '../../services/auth-temporary-password.service';
import {
  USR_REPOSITORY,
  UsrRepositoryPort,
} from '../../../usr/repositories/usr.repository.port';

@Injectable()
export class SendTemporaryPasswordUseCase {
  constructor(
    private readonly authTemporaryPasswordService: AuthTemporaryPasswordService,
    @Inject(USR_REPOSITORY)
    private readonly usrRepository: UsrRepositoryPort,
  ) {}

  private getUsrRepository(): UsrRepositoryPort {
    if (!this.usrRepository.isReady()) {
      throw new BusinessException(AuthErrorCode.USER_REPOSITORY_NOT_READY);
    }
    return this.usrRepository;
  }

  async execute(email: string): Promise<{ ok: true }> {
    const normalizedEmail = normalizeAuthEmail(email);
    const repo = this.getUsrRepository();
    const user = await repo.findByEmail(normalizedEmail);

    if (!user) {
      throw new BusinessException(AuthErrorCode.PASSWORD_RESET_USER_NOT_FOUND);
    }

    if (user.joinTypeCd !== 'EMAIL') {
      throw new BusinessException(AuthErrorCode.PASSWORD_RESET_NOT_AVAILABLE);
    }

    await this.authTemporaryPasswordService.sendTemporaryPassword(
      normalizedEmail,
    );
    return { ok: true };
  }
}
