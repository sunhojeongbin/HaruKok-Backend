import { ResponseCode } from './response-code';

export const UsrResponse = {
  DASHBOARD_FOUND: {
    httpCode: 200,
    message: '대시보드 정보를 불러왔어요.',
  },
  DASHBOARD_FETCH_FAILED: {
    httpCode: 500,
    message:
      '대시보드 정보를 불러오는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'USR_DASHBOARD_FETCH_FAILED',
  },
} as const satisfies Record<string, ResponseCode>;
