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
export const CommonResponse = {
  SUCCESS: {
    httpCode: 200,
    message: '요청이 성공적으로 처리되었습니다.',
  },
  INTERNAL_SERVER_ERROR: {
    httpCode: 500,
    message: '서버 내부 오류가 발생했습니다.',
    errorCode: 'INTERNAL_SERVER_ERROR',
  },
} as const satisfies Record<string, ResponseCode>;
