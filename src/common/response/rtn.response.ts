import { ResponseCode } from './response-code';

/**
 * @description 루틴 도메인 응답/에러 코드 집합
 */
export const RtnResponse = {
  ROUTINE_REPOSITORY_NOT_READY: {
    httpCode: 503,
    message: '루틴 저장소가 준비되지 않았습니다.',
    errorCode: 'ROUTINE_REPOSITORY_NOT_READY',
  },
  ROUTINE_CATEGORY_NOT_FOUND: {
    httpCode: 404,
    message: '사용자의 카테고리를 찾을 수 없습니다.',
    errorCode: 'ROUTINE_CATEGORY_NOT_FOUND',
  },
  ROUTINE_NAME_INVALID: {
    httpCode: 400,
    message: '루틴 내용은 공백이 아닌 1~100자여야 합니다.',
    errorCode: 'ROUTINE_NAME_INVALID',
  },
  ROUTINE_DATE_INVALID: {
    httpCode: 400,
    message: '루틴 날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)',
    errorCode: 'ROUTINE_DATE_INVALID',
  },
  ROUTINE_DATE_RANGE_INVALID: {
    httpCode: 400,
    message: '루틴 종료 날짜는 시작 날짜보다 빠를 수 없습니다.',
    errorCode: 'ROUTINE_DATE_RANGE_INVALID',
  },
  ROUTINE_REPEAT_DAYS_REQUIRED: {
    httpCode: 400,
    message: '매주 반복은 반복 요일을 1개 이상 선택해야 합니다.',
    errorCode: 'ROUTINE_REPEAT_DAYS_REQUIRED',
  },
  ROUTINE_REPEAT_DATES_REQUIRED: {
    httpCode: 400,
    message: '매월 반복은 반복 일자를 1개 이상 선택해야 합니다.',
    errorCode: 'ROUTINE_REPEAT_DATES_REQUIRED',
  },
  ROUTINE_ALARM_TIME_INVALID: {
    httpCode: 400,
    message: '알림 시간 형식이 올바르지 않습니다. (HH:mm 또는 HH:mm:ss)',
    errorCode: 'ROUTINE_ALARM_TIME_INVALID',
  },
  ROUTINE_TODO_DATES_EMPTY: {
    httpCode: 400,
    message: '선택한 기간/반복 조건으로 생성할 투두 날짜가 없습니다.',
    errorCode: 'ROUTINE_TODO_DATES_EMPTY',
  },
  ROUTINE_CREATE_SUCCESS: {
    httpCode: 201,
    message: '루틴이 생성되었습니다.',
  },
  ROUTINE_LIST_SUCCESS: {
    httpCode: 200,
    message: '루틴 목록 조회에 성공했습니다.',
  },
  ROUTINE_CREATE_FAILED: {
    httpCode: 500,
    message: '루틴 생성 중 오류가 발생했습니다.',
    errorCode: 'ROUTINE_CREATE_FAILED',
  },
  ROUTINE_LIST_FAILED: {
    httpCode: 500,
    message: '루틴 목록 조회 중 오류가 발생했습니다.',
    errorCode: 'ROUTINE_LIST_FAILED',
  },
} as const satisfies Record<string, ResponseCode>;
