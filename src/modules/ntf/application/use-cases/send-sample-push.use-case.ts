import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { NtfResponse } from '../../../../common/response/ntf.response';
import {
  NTF_TOKEN_REPOSITORY,
  NtfTokenRepositoryPort,
} from '../ports/ntf-token.repository.port';
import { PUSH_SENDER, PushSenderPort } from '../ports/push-sender.port';

/** @description 샘플 푸시 발송 입력 */
export type SendSamplePushInput = {
  title: string;
  body: string;
};

/** @description 샘플 푸시 발송 결과 */
export type SendSamplePushResult = {
  requestedTokenCount: number;
  invalidTokenCount: number;
};

/**
 * @description 로그인한 사용자의 활성 FCM 토큰 전체로 임의의 푸시를 발송한다(스웨거 테스트용).
 */
@Injectable()
export class SendSamplePushUseCase {
  constructor(
    @Inject(NTF_TOKEN_REPOSITORY)
    private readonly ntfTokenRepository: NtfTokenRepositoryPort,
    @Inject(PUSH_SENDER)
    private readonly pushSender: PushSenderPort,
  ) {}

  async execute(
    userId: string,
    input: SendSamplePushInput,
  ): Promise<SendSamplePushResult> {
    if (!this.ntfTokenRepository.isReady()) {
      throw new BusinessException(NtfResponse.NTF_TOKEN_REPOSITORY_NOT_READY);
    }

    const tokens = await this.ntfTokenRepository.findActiveTokensByUser(userId);
    if (tokens.length === 0) {
      throw new BusinessException(NtfResponse.NTF_TOKEN_NOT_FOUND);
    }

    let invalidTokens: string[];
    try {
      const result = await this.pushSender.send(tokens, {
        title: input.title,
        body: input.body,
      });
      invalidTokens = result.invalidTokens;
    } catch {
      throw new BusinessException(NtfResponse.PUSH_SEND_FAILED);
    }

    if (invalidTokens.length > 0) {
      await this.ntfTokenRepository.deactivateTokens(invalidTokens);
    }

    return {
      requestedTokenCount: tokens.length,
      invalidTokenCount: invalidTokens.length,
    };
  }
}
