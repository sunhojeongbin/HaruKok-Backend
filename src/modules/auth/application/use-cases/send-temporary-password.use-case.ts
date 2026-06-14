import { Inject, Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(SendTemporaryPasswordUseCase.name);

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
      this.logger.warn(
        `[send-temporary-password] no account for normalized email`,
      );
      return { ok: true };
    }

    if (user.joinTypeCd !== 'EMAIL') {
      this.logger.warn(
        `[send-temporary-password] non-EMAIL account (joinTypeCd=${user.joinTypeCd}) requested password reset`,
      );
      return { ok: true };
    }

    await this.authTemporaryPasswordService.sendTemporaryPassword(
      normalizedEmail,
    );
    return { ok: true };
  }
}
