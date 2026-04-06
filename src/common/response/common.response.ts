import { ResponseCode } from './response-code';

/**
 * @description 공통 응답 메시지
 * @example
 * ```ts
 * CommonResponse.SUCCESS
 * // {
 * //   httpCode: 200,
 * //   message: '요청이 성공적으로 처리됐어요.',
 * // }
 * ```
 */
export const CommonResponse = {
  SUCCESS: {
    httpCode: 200,
    message: '요청이 성공적으로 처리됐어요.',
  },
  INTERNAL_SERVER_ERROR: {
    httpCode: 500,
    message: '서버에서 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'INTERNAL_SERVER_ERROR',
  },
} as const satisfies Record<string, ResponseCode>;
