import { ResponseCode } from './response-code';

/**
 * @description 공통 응답 메시지
 * @example
 * ```ts
 * CommonResponse.SUCCESS
 * // {
 * //   httpCode: 200,
 * //   message: '요청이 성공적으로 처리되었습니다.',
 * // }
 * ```
 */
export const AuthResponse = {
  EMAIL_CODE_SENT: {
    httpCode: 200,
    message: '이메일 인증 코드가 발송되었습니다.',
  },
  EMAIL_SEND_FAILED: {
    httpCode: 500,
    message: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
    errorCode: 'EMAIL_SEND_FAILED',
  },
  EMAIL_CODE_FORMAT_INVALID: {
    httpCode: 400,
    message: '인증 코드 형식이 올바르지 않습니다.',
    errorCode: 'EMAIL_CODE_FORMAT_INVALID',
  },
  EMAIL_CODE_EXPIRED_OR_NOT_FOUND: {
    httpCode: 400,
    message: '인증 코드가 없거나 만료되었습니다.',
    errorCode: 'EMAIL_CODE_EXPIRED_OR_NOT_FOUND',
  },
  EMAIL_CODE_ATTEMPTS_EXCEEDED: {
    httpCode: 429,
    message: '인증 코드 검증 시도 횟수를 초과했습니다.',
    errorCode: 'EMAIL_CODE_ATTEMPTS_EXCEEDED',
  },
  EMAIL_CODE_INVALID: {
    httpCode: 400,
    message: '인증 코드가 올바르지 않습니다.',
    errorCode: 'EMAIL_CODE_INVALID',
  },
  EMAIL_CODE_VERIFIED: {
    httpCode: 200,
    message: '이메일 인증이 완료되었습니다.',
  },
  AUTH_CONFIG_INVALID: {
    httpCode: 500,
    message: '인증 설정이 올바르지 않습니다.',
    errorCode: 'AUTH_CONFIG_INVALID',
  },
  SIGNUP_TOKEN_INVALID: {
    httpCode: 403,
    message: '회원가입 토큰이 유효하지 않습니다.',
    errorCode: 'SIGNUP_TOKEN_INVALID',
  },
  SIGNUP_TOKEN_FORMAT_INVALID: {
    httpCode: 403,
    message: '회원가입 토큰 형식이 올바르지 않습니다.',
    errorCode: 'SIGNUP_TOKEN_FORMAT_INVALID',
  },
  SIGNUP_EMAIL_MISMATCH: {
    httpCode: 400,
    message: '이메일 인증 토큰과 요청 이메일이 다릅니다.',
    errorCode: 'SIGNUP_EMAIL_MISMATCH',
  },
  SIGNUP_ALREADY_EXISTS: {
    httpCode: 409,
    message: '이미 가입된 이메일입니다.',
    errorCode: 'SIGNUP_ALREADY_EXISTS',
  },
  SIGNUP_SUCCESS: {
    httpCode: 201,
    message: '회원가입이 완료되었습니다.',
  },
  SIGNUP_SAVE_FAILED: {
    httpCode: 500,
    message: '회원가입 처리 중 오류가 발생했습니다.',
    errorCode: 'SIGNUP_SAVE_FAILED',
  },
  USER_REPOSITORY_NOT_READY: {
    httpCode: 503,
    message: '사용자 저장소가 준비되지 않았습니다.',
    errorCode: 'USER_REPOSITORY_NOT_READY',
  },
  LOGIN_SUCCESS: {
    httpCode: 200,
    message: '로그인에 성공했습니다.',
  },
  LOGIN_FAIL: {
    httpCode: 401,
    message: '아이디 또는 비밀번호가 올바르지 않습니다.',
    errorCode: 'UNAUTHORIZED',
  },
  REFRESH_TOKEN_REQUIRED: {
    httpCode: 401,
    message: '리프레시 토큰이 필요합니다.',
    errorCode: 'REFRESH_TOKEN_REQUIRED',
  },
  REFRESH_TOKEN_INVALID: {
    httpCode: 401,
    message: '리프레시 토큰이 유효하지 않습니다.',
    errorCode: 'REFRESH_TOKEN_INVALID',
  },
  TOKEN_REFRESH_SUCCESS: {
    httpCode: 200,
    message: '토큰 재발급에 성공했습니다.',
  },
  LOGOUT_SUCCESS: {
    httpCode: 200,
    message: '로그아웃에 성공했습니다.',
  },
  USER_FOUND: {
    httpCode: 200,
    message: '사용자 정보 조회에 성공했습니다.',
  },
  USER_NOT_FOUND: {
    httpCode: 404,
    message: '사용자를 찾을 수 없습니다.',
    errorCode: 'USER_NOT_FOUND',
  },
} as const satisfies Record<string, ResponseCode>;
