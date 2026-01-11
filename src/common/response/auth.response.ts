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
  LOGIN_SUCCESS: {
    httpCode: 200,
    message: '로그인에 성공했습니다.',
  },
  LOGIN_FAIL: {
    httpCode: 401,
    message: '아이디 또는 비밀번호가 올바르지 않습니다.',
    errorCode: 'UNAUTHORIZED',
  },
} as const satisfies Record<string, ResponseCode>;
