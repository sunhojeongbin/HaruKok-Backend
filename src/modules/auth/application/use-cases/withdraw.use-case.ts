import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { AuthErrorCode } from '../../errors/auth-error-code';
import {
  USR_REPOSITORY,
  UsrRepositoryPort,
} from '../../../usr/repositories/usr.repository.port';

@Injectable()
export class WithdrawUseCase {
  constructor(
    @Inject(USR_REPOSITORY)
    private readonly usrRepository: UsrRepositoryPort,
  ) {}

  private getUsrRepository(): UsrRepositoryPort {
    if (!this.usrRepository.isReady()) {
      throw new BusinessException(AuthErrorCode.USER_REPOSITORY_NOT_READY);
    }
    return this.usrRepository;
  }

  async execute(userId: string): Promise<{ ok: true }> {
    const repo = this.getUsrRepository();
    const user = await repo.findActiveById(userId);

    if (!user) {
      throw new BusinessException(AuthErrorCode.USER_NOT_FOUND);
    }

    try {
      await repo.hardDeleteById(userId);
    } catch {
      throw new BusinessException(AuthErrorCode.WITHDRAW_SAVE_FAILED);
    }

    return { ok: true };
  }
}
