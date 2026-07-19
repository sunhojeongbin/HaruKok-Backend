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
    message: '이메일 인증 번호를 보내드렸어요.',
  },
  EMAIL_SEND_FAILED: {
    httpCode: 500,
    message: '이메일을 보내는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'EMAIL_SEND_FAILED',
  },
  EMAIL_CODE_FORMAT_INVALID: {
    httpCode: 400,
    message:
      '인증 번호가 올바르지 않아요. 이메일에서 받은 인증 번호를 다시 입력해 주세요.',
    errorCode: 'EMAIL_CODE_FORMAT_INVALID',
  },
  EMAIL_CODE_EXPIRED_OR_NOT_FOUND: {
    httpCode: 400,
    message:
      '인증 번호를 찾을 수 없거나 이미 만료됐어요. 인증 번호를 다시 요청해 주세요.',
    errorCode: 'EMAIL_CODE_EXPIRED_OR_NOT_FOUND',
  },
  EMAIL_CODE_RESEND_TOO_SOON: {
    httpCode: 429,
    message: '인증 번호를 방금 보내드렸어요. 잠시 후 다시 요청해 주세요.',
    errorCode: 'EMAIL_CODE_RESEND_TOO_SOON',
  },
  EMAIL_CODE_ATTEMPTS_EXCEEDED: {
    httpCode: 429,
    message:
      '인증 번호 확인 시도 횟수를 초과했어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'EMAIL_CODE_ATTEMPTS_EXCEEDED',
  },
  EMAIL_CODE_INVALID: {
    httpCode: 400,
    message: '인증 번호가 올바르지 않아요. 인증 번호를 다시 확인해 주세요.',
    errorCode: 'EMAIL_CODE_INVALID',
  },
  EMAIL_CODE_VERIFIED: {
    httpCode: 200,
    message: '이메일 인증이 완료됐어요.',
  },
  EMAIL_CODE_RESENT: {
    httpCode: 200,
    message: '이메일 인증 번호를 다시 보내드렸어요.',
  },
  PASSWORD_RESET_TEMP_SENT: {
    httpCode: 200,
    message: '임시 비밀번호를 이메일로 보내드렸어요.',
  },
  PASSWORD_RESET_TEMP_SEND_FAILED: {
    httpCode: 500,
    message:
      '임시 비밀번호를 보내는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'PASSWORD_RESET_TEMP_SEND_FAILED',
  },
  PASSWORD_RESET_USER_NOT_FOUND: {
    httpCode: 404,
    message:
      '입력한 이메일로 가입된 계정을 찾지 못했어요. 이메일을 다시 확인해 주세요.',
    errorCode: 'PASSWORD_RESET_USER_NOT_FOUND',
  },
  PASSWORD_RESET_NOT_AVAILABLE: {
    httpCode: 400,
    message:
      '이 계정은 비밀번호 재설정을 지원하지 않아요. 가입한 소셜 로그인으로 이용해 주세요.',
    errorCode: 'PASSWORD_RESET_NOT_AVAILABLE',
  },
  TEMP_PASSWORD_EXPIRED_OR_NOT_FOUND: {
    httpCode: 400,
    message:
      '임시 비밀번호를 찾을 수 없거나 만료됐어요. 임시 비밀번호를 다시 받아 주세요.',
    errorCode: 'TEMP_PASSWORD_EXPIRED_OR_NOT_FOUND',
  },
  TEMP_PASSWORD_ATTEMPTS_EXCEEDED: {
    httpCode: 429,
    message:
      '임시 비밀번호 확인 시도가 너무 많아요. 임시 비밀번호를 다시 받아 주세요.',
    errorCode: 'TEMP_PASSWORD_ATTEMPTS_EXCEEDED',
  },
  TEMP_PASSWORD_INVALID: {
    httpCode: 400,
    message: '임시 비밀번호가 올바르지 않아요. 다시 확인해 주세요.',
    errorCode: 'TEMP_PASSWORD_INVALID',
  },
  PASSWORD_RESET_SUCCESS: {
    httpCode: 200,
    message: '비밀번호가 변경됐어요. 새 비밀번호로 로그인해 주세요.',
  },
  PASSWORD_RESET_SAVE_FAILED: {
    httpCode: 500,
    message:
      '비밀번호를 변경하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'PASSWORD_RESET_SAVE_FAILED',
  },
  AUTH_CONFIG_INVALID: {
    httpCode: 500,
    message: '인증에 실패했어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'AUTH_CONFIG_INVALID',
  },
  SIGNUP_TOKEN_INVALID: {
    httpCode: 403,
    message:
      '회원가입 토큰이 유효하지 않아요. 이메일 인증을 다시 진행해 주세요.',
    errorCode: 'SIGNUP_TOKEN_INVALID',
  },
  SIGNUP_TOKEN_FORMAT_INVALID: {
    httpCode: 403,
    message:
      '회원가입 토큰 형식이 올바르지 않아요. 이메일 인증을 다시 진행해 주세요.',
    errorCode: 'SIGNUP_TOKEN_FORMAT_INVALID',
  },
  SIGNUP_EMAIL_MISMATCH: {
    httpCode: 400,
    message:
      '인증한 이메일과 요청한 이메일이 달라요. 인증한 이메일 주소로 다시 시도해 주세요.',
    errorCode: 'SIGNUP_EMAIL_MISMATCH',
  },
  SIGNUP_ALREADY_EXISTS: {
    httpCode: 409,
    message:
      '이미 가입된 이메일이에요. 로그인하거나 비밀번호 찾기를 이용해 주세요.',
    errorCode: 'SIGNUP_ALREADY_EXISTS',
  },
  SIGNUP_SUCCESS: {
    httpCode: 201,
    message: '회원가입이 완료됐어요.',
  },
  EMAIL_CHANGE_ALREADY_EXISTS: {
    httpCode: 409,
    message: '이미 회원가입 된 이메일입니다. 다시 확인해주세요.',
    errorCode: 'EMAIL_CHANGE_ALREADY_EXISTS',
  },
  EMAIL_CHANGE_SAME_AS_CURRENT: {
    httpCode: 400,
    message: '현재 사용 중인 이메일과 동일해요. 다른 이메일을 입력해 주세요.',
    errorCode: 'EMAIL_CHANGE_SAME_AS_CURRENT',
  },
  EMAIL_CHANGE_SUCCESS: {
    httpCode: 200,
    message: '이메일이 변경됐어요.',
  },
  EMAIL_CHANGE_SAVE_FAILED: {
    httpCode: 500,
    message:
      '이메일을 변경하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'EMAIL_CHANGE_SAVE_FAILED',
  },
  SIGNUP_SAVE_FAILED: {
    httpCode: 500,
    message: '회원가입 처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'SIGNUP_SAVE_FAILED',
  },
  USER_REPOSITORY_NOT_READY: {
    httpCode: 503,
    message:
      '사용자 정보를 처리할 준비가 아직 안 됐어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'USER_REPOSITORY_NOT_READY',
  },
  LOGIN_SUCCESS: {
    httpCode: 200,
    message: '로그인에 성공했어요.',
  },
  LOGIN_FAIL: {
    httpCode: 401,
    message: '아이디 또는 비밀번호를 다시 확인해 주세요.',
    errorCode: 'UNAUTHORIZED',
  },
  REFRESH_TOKEN_REQUIRED: {
    httpCode: 401,
    message: '로그인 정보가 필요해요. 다시 로그인해 주세요.',
    errorCode: 'REFRESH_TOKEN_REQUIRED',
  },
  REFRESH_TOKEN_INVALID: {
    httpCode: 401,
    message: '로그인 정보가 만료됐어요. 다시 로그인해 주세요.',
    errorCode: 'REFRESH_TOKEN_INVALID',
  },
  TOKEN_REFRESH_SUCCESS: {
    httpCode: 200,
    message: '토큰을 새로 발급해 드렸어요.',
  },
  LOGOUT_SUCCESS: {
    httpCode: 200,
    message: '로그아웃에 성공했어요.',
  },
  USER_FOUND: {
    httpCode: 200,
    message: '사용자 정보를 불러왔어요.',
  },
  USER_NOT_FOUND: {
    httpCode: 404,
    message:
      '사용자 정보를 찾지 못했어요. 다시 로그인한 뒤 다시 시도해 주세요.',
    errorCode: 'USER_NOT_FOUND',
  },
  UPDATE_PASSWORD_SUCCESS: {
    httpCode: 200,
    message: '비밀번호가 변경됐어요. 다시 로그인해 주세요.',
  },
  UPDATE_PASSWORD_NOT_AVAILABLE: {
    httpCode: 400,
    message:
      '이 계정은 비밀번호 변경을 지원하지 않아요. 가입한 소셜 로그인으로 이용해 주세요.',
    errorCode: 'UPDATE_PASSWORD_NOT_AVAILABLE',
  },
  UPDATE_PASSWORD_WRONG_CURRENT: {
    httpCode: 400,
    message: '현재 비밀번호가 올바르지 않아요. 다시 확인해 주세요.',
    errorCode: 'UPDATE_PASSWORD_WRONG_CURRENT',
  },
  UPDATE_PASSWORD_SAME_AS_CURRENT: {
    httpCode: 400,
    message: '현재 비밀번호와 동일한 비밀번호로는 변경할 수 없어요.',
    errorCode: 'UPDATE_PASSWORD_SAME_AS_CURRENT',
  },
  UPDATE_PASSWORD_SAVE_FAILED: {
    httpCode: 500,
    message:
      '비밀번호를 변경하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'UPDATE_PASSWORD_SAVE_FAILED',
  },
  VERIFY_PASSWORD_SUCCESS: {
    httpCode: 200,
    message: '비밀번호 확인이 완료됐어요.',
  },
  WITHDRAW_SUCCESS: {
    httpCode: 200,
    message: '회원 탈퇴가 완료됐어요.',
  },
  WITHDRAW_SAVE_FAILED: {
    httpCode: 500,
    message: '탈퇴 처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'WITHDRAW_SAVE_FAILED',
  },
  GOOGLE_LOGIN_SUCCESS: {
    httpCode: 200,
    message: '구글 로그인에 성공했어요.',
  },
  GOOGLE_TOKEN_INVALID: {
    httpCode: 401,
    message: '구글 로그인 정보가 올바르지 않아요. 다시 시도해 주세요.',
    errorCode: 'GOOGLE_TOKEN_INVALID',
  },
  GOOGLE_SAVE_FAILED: {
    httpCode: 500,
    message: '구글 로그인 처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'GOOGLE_SAVE_FAILED',
  },
} as const satisfies Record<string, ResponseCode>;
