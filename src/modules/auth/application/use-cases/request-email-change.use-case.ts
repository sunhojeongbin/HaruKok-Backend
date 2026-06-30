import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { AuthErrorCode } from '../../errors/auth-error-code';
import { normalizeAuthEmail } from '../../domain/policies/auth-normalization.policy';
import { AuthEmailCodeService } from '../services/auth-email-code.service';
import {
  USR_REPOSITORY,
  UsrRepositoryPort,
} from '../../../usr/repositories/usr.repository.port';

/**
 * @description 로그인된 사용자가 변경하려는 새 이메일로 인증 번호를 전송한다.
 *              이미 가입된 이메일이거나 현재 이메일과 동일하면 전송을 막는다.
 */
@Injectable()
export class RequestEmailChangeUseCase {
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

  async execute(userId: string, newEmail: string): Promise<{ ok: true }> {
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
      await this.authEmailCodeService.clearCode(normalizedEmail);
      throw new BusinessException(AuthErrorCode.EMAIL_CHANGE_ALREADY_EXISTS);
    }

    await this.authEmailCodeService.sendCode(normalizedEmail);
    return { ok: true };
  }
}
