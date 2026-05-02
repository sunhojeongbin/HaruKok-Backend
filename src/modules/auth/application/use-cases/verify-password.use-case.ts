import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { AuthErrorCode } from '../../errors/auth-error-code';
import { AuthPasswordService } from '../../services/auth-password.service';
import {
  USR_REPOSITORY,
  UsrRepositoryPort,
} from '../../../usr/repositories/usr.repository.port';

@Injectable()
export class VerifyPasswordUseCase {
  constructor(
    private readonly authPasswordService: AuthPasswordService,
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
    password: string,
  ): Promise<{ matched: boolean }> {
    const repo = this.getUsrRepository();
    const user = await repo.findActiveById(userId);

    if (!user) {
      throw new BusinessException(AuthErrorCode.USER_NOT_FOUND);
    }

    if (user.joinTypeCd !== 'EMAIL') {
      return { matched: false };
    }

    const matched = await this.authPasswordService.verifyPassword(
      user.pwd,
      user.pwdHash,
      password,
    );

    return { matched };
  }
}
