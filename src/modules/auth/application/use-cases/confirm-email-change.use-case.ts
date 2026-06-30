import { Inject, Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { AuthErrorCode } from '../../errors/auth-error-code';
import { normalizeAuthEmail } from '../../domain/policies/auth-normalization.policy';
import { AuthEmailCodeService } from '../services/auth-email-code.service';
import {
  USR_REPOSITORY,
  UsrRepositoryPort,
} from '../../../usr/repositories/usr.repository.port';

/**
 * @description 새 이메일로 전송된 인증 번호를 검증하고, 성공 시 사용자의 이메일을 교체한다.
 */
@Injectable()
export class ConfirmEmailChangeUseCase {
  constructor(
    private readonly authEmailCodeService: AuthEmailCodeService,
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
    newEmail: string,
    code: string,
  ): Promise<{ ok: true }> {
    const repo = this.getUsrRepository();

    const user = await repo.findActiveById(userId);
    if (!user) {
      throw new BusinessException(AuthErrorCode.USER_NOT_FOUND);
    }

    const normalizedEmail = normalizeAuthEmail(newEmail);

    if (user.usrEmail === normalizedEmail) {
      throw new BusinessException(AuthErrorCode.EMAIL_CHANGE_SAME_AS_CURRENT);
    }

    const existing = await repo.findByEmail(normalizedEmail);
    if (existing && existing.usrId !== userId) {
      throw new BusinessException(AuthErrorCode.EMAIL_CHANGE_ALREADY_EXISTS);
    }

    await this.authEmailCodeService.verifyCode(normalizedEmail, code);

    user.usrEmail = normalizedEmail;

    try {
      await repo.save(user);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23505'
      ) {
        throw new BusinessException(AuthErrorCode.EMAIL_CHANGE_ALREADY_EXISTS);
      }
      throw new BusinessException(AuthErrorCode.EMAIL_CHANGE_SAVE_FAILED);
    }

    await this.authEmailCodeService.clearCode(normalizedEmail);
    return { ok: true };
  }
}
