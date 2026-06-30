import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { NtfResponse } from '../../../../common/response/ntf.response';
import {
  NTF_TOKEN_REPOSITORY,
  NtfTokenRepositoryPort,
} from '../ports/ntf-token.repository.port';

/** @description FCM 토큰 삭제 입력 */
export type RemoveNtfTokenInput = {
  fcmToken: string;
};

/** @description 사용자 소유의 FCM 디바이스 토큰을 삭제하는 유스케이스 */
@Injectable()
export class RemoveNtfTokenUseCase {
  constructor(
    @Inject(NTF_TOKEN_REPOSITORY)
    private readonly ntfTokenRepository: NtfTokenRepositoryPort,
  ) {}

  async execute(userId: string, input: RemoveNtfTokenInput): Promise<void> {
    if (!this.ntfTokenRepository.isReady()) {
      throw new BusinessException(NtfResponse.NTF_TOKEN_REPOSITORY_NOT_READY);
    }

    const fcmToken = input.fcmToken.trim();

    let removed: boolean;
    try {
      removed = await this.ntfTokenRepository.removeByUsrAndToken(
        userId,
        fcmToken,
      );
    } catch {
      throw new BusinessException(NtfResponse.NTF_TOKEN_REMOVE_FAILED);
    }

    // 본인 소유가 아니거나 존재하지 않으면 삭제된 행이 없다.
    if (!removed) {
      throw new BusinessException(NtfResponse.NTF_TOKEN_NOT_FOUND);
    }
  }
}
