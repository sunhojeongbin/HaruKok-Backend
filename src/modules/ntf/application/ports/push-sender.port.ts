export const PUSH_SENDER = Symbol('PUSH_SENDER');

/** @description 푸시 메시지 페이로드 */
export type PushPayload = {
  title: string;
  body: string;
};

/** @description 푸시 발송 결과 */
export type PushSendResult = {
  /** @description 더 이상 유효하지 않아 정리해야 할 토큰 목록 */
  invalidTokens: string[];
};

/** @description 푸시 발송 추상화 (FCM 어댑터로 구현) */
export interface PushSenderPort {
  send(fcmTokens: string[], payload: PushPayload): Promise<PushSendResult>;
}
