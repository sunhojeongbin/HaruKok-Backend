import { ResponseCode } from './response-code';

/**
 * @description 알림(FCM) 도메인 응답/에러 코드 집합
 */
export const NtfResponse = {
  NTF_TOKEN_REPOSITORY_NOT_READY: {
    httpCode: 503,
    message:
      '알림 정보를 처리할 준비가 아직 안 됐어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'NTF_TOKEN_REPOSITORY_NOT_READY',
  },
  NTF_TOKEN_PLATFORM_INVALID: {
    httpCode: 400,
    message:
      '지원하지 않는 플랫폼이에요. AOS, IOS, WEB 중 하나로 입력해 주세요.',
    errorCode: 'NTF_TOKEN_PLATFORM_INVALID',
  },
  NTF_TOKEN_NOT_FOUND: {
    httpCode: 404,
    message: '등록된 디바이스 토큰을 찾지 못했어요.',
    errorCode: 'NTF_TOKEN_NOT_FOUND',
  },
  NTF_TOKEN_REGISTER_SUCCESS: {
    httpCode: 201,
    message: '디바이스 토큰이 등록됐어요.',
  },
  NTF_TOKEN_REMOVE_SUCCESS: {
    httpCode: 200,
    message: '디바이스 토큰이 삭제됐어요.',
  },
  NTF_TOKEN_SAVE_FAILED: {
    httpCode: 500,
    message:
      '디바이스 토큰을 저장하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'NTF_TOKEN_SAVE_FAILED',
  },
  NTF_TOKEN_REMOVE_FAILED: {
    httpCode: 500,
    message:
      '디바이스 토큰을 삭제하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'NTF_TOKEN_REMOVE_FAILED',
  },
  PUSH_SEND_FAILED: {
    httpCode: 500,
    message: '푸시 알림을 전송하는 중 문제가 생겼어요.',
    errorCode: 'PUSH_SEND_FAILED',
  },
  PUSH_SEND_SUCCESS: {
    httpCode: 200,
    message: '푸시 알림을 전송했어요.',
  },
} as const satisfies Record<string, ResponseCode>;
