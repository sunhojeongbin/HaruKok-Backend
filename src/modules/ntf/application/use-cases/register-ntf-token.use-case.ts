import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { AuthResponse } from '../../../../common/response/auth.response';
import { NtfResponse } from '../../../../common/response/ntf.response';
import {
  USR_REPOSITORY,
  UsrRepositoryPort,
} from '../../../usr/repositories/usr.repository.port';
import { NtfTokenEntity } from '../../entities/ntf-token.entity';
import {
  NTF_TOKEN_REPOSITORY,
  NtfTokenRepositoryPort,
} from '../ports/ntf-token.repository.port';

/** @description 지원 플랫폼 코드 */
const SUPPORTED_PLATFORMS = new Set<string>(['AOS', 'IOS', 'WEB']);

/** @description FCM 토큰 등록 입력 */
export type RegisterNtfTokenInput = {
  fcmToken: string;
  platformCd: string;
};

/** @description FCM 디바이스 토큰을 저장/갱신하는 유스케이스 */
@Injectable()
export class RegisterNtfTokenUseCase {
  constructor(
    @Inject(USR_REPOSITORY)
    private readonly usrRepository: UsrRepositoryPort,
    @Inject(NTF_TOKEN_REPOSITORY)
    private readonly ntfTokenRepository: NtfTokenRepositoryPort,
  ) {}

  async execute(
    userId: string,
    input: RegisterNtfTokenInput,
  ): Promise<NtfTokenEntity> {
    if (!this.ntfTokenRepository.isReady()) {
      throw new BusinessException(NtfResponse.NTF_TOKEN_REPOSITORY_NOT_READY);
    }

    const platformCd = input.platformCd?.trim().toUpperCase();
    if (!platformCd || !SUPPORTED_PLATFORMS.has(platformCd)) {
      throw new BusinessException(NtfResponse.NTF_TOKEN_PLATFORM_INVALID);
    }

    const fcmToken = input.fcmToken.trim();

    const user = await this.usrRepository.findActiveById(userId);
    if (!user) {
      throw new BusinessException(AuthResponse.USER_NOT_FOUND);
    }

    try {
      return await this.ntfTokenRepository.upsertToken(
        userId,
        fcmToken,
        platformCd,
      );
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException(NtfResponse.NTF_TOKEN_SAVE_FAILED);
    }
  }
}
