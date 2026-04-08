import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { AuthErrorCode } from '../../errors/auth-error-code';
import { normalizeAuthEmail } from '../../domain/policies/auth-normalization.policy';
import { AuthEmailCodeService } from '../services/auth-email-code.service';
import {
  USR_REPOSITORY,
  UsrRepositoryPort,
} from '../../../usr/repositories/usr.repository.port';

@Injectable()
export class SendEmailCodeUseCase {
  constructor(
    private readonly authEmailCodeService: AuthEmailCodeService,
    @Inject(USR_REPOSITORY)
    private readonly usrRepository: UsrRepositoryPort,
  ) {}

  async execute(email: string): Promise<{ ok: true }> {
    const normalizedEmail = normalizeAuthEmail(email);

    if (this.usrRepository.isReady()) {
      const existing = await this.usrRepository.findByEmail(normalizedEmail);
      if (existing) {
        await this.authEmailCodeService.clearCode(normalizedEmail);
        throw new BusinessException(AuthErrorCode.SIGNUP_ALREADY_EXISTS);
      }
    }

    await this.authEmailCodeService.sendCode(normalizedEmail);
    return { ok: true };
  }
}
