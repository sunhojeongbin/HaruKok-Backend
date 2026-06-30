import { ConfigService } from '@nestjs/config';

/** @description Firebase Admin SDK 서비스 계정 자격 증명 */
export type FirebaseCredential = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

/**
 * @description 환경변수에서 Firebase 자격 증명을 읽는다.
 *              자격 증명이 없으면 null을 반환해 푸시 발송을 비활성화(NoOp)한다.
 */
export function getFirebaseCredential(
  config: ConfigService,
): FirebaseCredential | null {
  const projectId = config.get<string>('FIREBASE_PROJECT_ID');
  const clientEmail = config.get<string>('FIREBASE_CLIENT_EMAIL');
  const rawPrivateKey = config.get<string>('FIREBASE_PRIVATE_KEY');

  if (!projectId || !clientEmail || !rawPrivateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    // .env에 escape된 줄바꿈(\n)을 실제 줄바꿈으로 복원
    privateKey: rawPrivateKey.replace(/\\n/g, '\n'),
  };
}

/** @description 일일 투두 요약 푸시 발송 시각(KST, 0~23). 기본값 9시. */
export function getDailySummaryHour(config: ConfigService): number {
  const raw = config.get<string>('PUSH_DAILY_SUMMARY_HOUR');
  const hour = Number(raw ?? 9);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return 9;
  }
  return hour;
}
