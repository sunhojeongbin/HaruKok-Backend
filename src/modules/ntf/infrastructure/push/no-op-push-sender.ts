import { Logger } from '@nestjs/common';
import {
  PushPayload,
  PushSendResult,
  PushSenderPort,
} from '../../application/ports/push-sender.port';

/**
 * @description Firebase 자격 증명이 없거나 SKIP_DB 환경에서 사용하는 푸시 발송기.
 *              실제 발송 없이 로그만 남긴다.
 */
export class NoOpPushSender implements PushSenderPort {
  private readonly logger = new Logger(NoOpPushSender.name);

  send(fcmTokens: string[], payload: PushPayload): Promise<PushSendResult> {
    void payload;
    this.logger.debug(
      `푸시 비활성화 상태 - ${fcmTokens.length}건 발송을 생략합니다.`,
    );
    return Promise.resolve({ invalidTokens: [] });
  }
}
