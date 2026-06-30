import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirebaseCredential } from '../../../../config/firebase.config';
import { PushSenderPort } from '../../application/ports/push-sender.port';
import { FcmPushSender } from './fcm-push-sender';
import { NoOpPushSender } from './no-op-push-sender';

const FIREBASE_APP_NAME = 'harukok';

/**
 * @description Firebase 자격 증명 유무에 따라 FCM 발송기 또는 NoOp 발송기를 생성한다.
 *              firebase-admin 앱은 프로세스당 1회만 초기화한다.
 */
export function createPushSender(config: ConfigService): PushSenderPort {
  const logger = new Logger('PushSenderFactory');
  const credential = getFirebaseCredential(config);

  if (!credential) {
    logger.warn(
      'Firebase 자격 증명이 없어 푸시 발송이 비활성화됩니다(NoOp 모드).',
    );
    return new NoOpPushSender();
  }

  const existingApp = getApps().find((app) => app.name === FIREBASE_APP_NAME);
  const app =
    existingApp ??
    initializeApp(
      {
        credential: cert({
          projectId: credential.projectId,
          clientEmail: credential.clientEmail,
          privateKey: credential.privateKey,
        }),
      },
      FIREBASE_APP_NAME,
    );

  logger.log('Firebase Admin SDK 초기화 완료');
  return new FcmPushSender(getMessaging(app));
}
