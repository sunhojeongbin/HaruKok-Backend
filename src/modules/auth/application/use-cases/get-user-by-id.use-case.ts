import { Inject, Injectable } from '@nestjs/common';
import { AuthFallbackService } from '../../services/auth-fallback.service';
import { UserInfo } from '../../types/auth.types';
import {
  USR_REPOSITORY,
  UsrRepositoryPort,
} from '../../../usr/repositories/usr.repository.port';

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    private readonly authFallbackService: AuthFallbackService,
    @Inject(USR_REPOSITORY)
    private readonly usrRepository: UsrRepositoryPort,
  ) {}

  execute(userId: string): Promise<UserInfo | null> {
    return this.getUserById(userId);
  }

  private async getUserById(userId: string): Promise<UserInfo | null> {
    if (!this.usrRepository.isReady()) {
      return this.authFallbackService.getUserById(userId);
    }

    const user = await this.usrRepository.findActiveById(userId);
    if (!user) {
      return null;
    }

    return {
      id: user.usrId,
      name: user.usrNm,
      email: user.usrEmail ?? '',
    };
  }
}
