import { Logger } from '@nestjs/common';
import type { Messaging } from 'firebase-admin/messaging';
import {
  PushPayload,
  PushSendResult,
  PushSenderPort,
} from '../../application/ports/push-sender.port';

/** @description 더 이상 유효하지 않은 토큰으로 간주하는 FCM 에러 코드 */
const INVALID_TOKEN_ERROR_CODES = new Set<string>([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

/** @description firebase-admin 기반 FCM 푸시 발송기 */
export class FcmPushSender implements PushSenderPort {
  private readonly logger = new Logger(FcmPushSender.name);

  constructor(private readonly messaging: Messaging) {}

  async send(
    fcmTokens: string[],
    payload: PushPayload,
  ): Promise<PushSendResult> {
    if (fcmTokens.length === 0) {
      return { invalidTokens: [] };
    }

    const response = await this.messaging.sendEachForMulticast({
      tokens: fcmTokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((res, index) => {
      if (res.success) {
        return;
      }
      const token = fcmTokens[index];
      const code = res.error?.code;
      if (token && code && INVALID_TOKEN_ERROR_CODES.has(code)) {
        invalidTokens.push(token);
      }
      this.logger.warn(`푸시 발송 실패 [${code ?? 'unknown'}]`);
    });

    return { invalidTokens };
  }
}
