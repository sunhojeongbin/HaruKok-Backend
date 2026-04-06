import { ResponseCode } from './response-code';

/**
 * @description 루틴 도메인 응답/에러 코드 집합
 */
export const RtnResponse = {
  ROUTINE_REPOSITORY_NOT_READY: {
    httpCode: 503,
    message:
      '루틴 정보를 처리할 준비가 아직 안 됐어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'ROUTINE_REPOSITORY_NOT_READY',
  },
  ROUTINE_CATEGORY_NOT_FOUND: {
    httpCode: 404,
    message: '카테고리를 찾지 못했어요. 카테고리를 다시 확인해 주세요.',
    errorCode: 'ROUTINE_CATEGORY_NOT_FOUND',
  },
  ROUTINE_NAME_INVALID: {
    httpCode: 400,
    message: '루틴 내용은 공백 없이 1~100자로 입력해 주세요.',
    errorCode: 'ROUTINE_NAME_INVALID',
  },
  ROUTINE_DATE_INVALID: {
    httpCode: 400,
    message:
      '루틴 날짜 형식이 올바르지 않아요. YYYY-MM-DD 형식으로 입력해 주세요.',
    errorCode: 'ROUTINE_DATE_INVALID',
  },
  ROUTINE_DATE_RANGE_INVALID: {
    httpCode: 400,
    message:
      '루틴 종료 날짜는 시작 날짜보다 빠를 수 없어요. 날짜를 다시 확인해 주세요.',
    errorCode: 'ROUTINE_DATE_RANGE_INVALID',
  },
  ROUTINE_REPEAT_DAYS_REQUIRED: {
    httpCode: 400,
    message: '매주 반복은 반복 요일을 1개 이상 선택해 주세요.',
    errorCode: 'ROUTINE_REPEAT_DAYS_REQUIRED',
  },
  ROUTINE_REPEAT_DATES_REQUIRED: {
    httpCode: 400,
    message: '매월 반복은 반복 일자를 1개 이상 선택해 주세요.',
    errorCode: 'ROUTINE_REPEAT_DATES_REQUIRED',
  },
  ROUTINE_ALARM_TIME_INVALID: {
    httpCode: 400,
    message: '알림 시간 형식이 올바르지 않아요. 24:00 형식으로 입력해 주세요.',
    errorCode: 'ROUTINE_ALARM_TIME_INVALID',
  },
  ROUTINE_TODO_DATES_EMPTY: {
    httpCode: 400,
    message:
      '선택한 기간이나 반복 조건으로 만들 수 있는 투두가 없어요. 기간이나 반복 조건을 다시 설정해 주세요.',
    errorCode: 'ROUTINE_TODO_DATES_EMPTY',
  },
  ROUTINE_UPDATE_PAYLOAD_EMPTY: {
    httpCode: 400,
    message:
      '수정할 항목(카테고리, 루틴 내용, 시작 날짜, 종료 날짜, 반복 유형, 반복 요일, 반복 일자, 알림 시간)을 1개 이상 입력해 주세요.',
    errorCode: 'ROUTINE_UPDATE_PAYLOAD_EMPTY',
  },
  ROUTINE_ORDER_INVALID: {
    httpCode: 400,
    message: '루틴 순서가 올바르지 않아요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'ROUTINE_ORDER_INVALID',
  },
  ROUTINE_NOT_FOUND: {
    httpCode: 404,
    message: '루틴을 찾지 못했어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'ROUTINE_NOT_FOUND',
  },
  ROUTINE_CREATE_SUCCESS: {
    httpCode: 201,
    message: '루틴이 추가됐어요.',
  },
  ROUTINE_GET_SUCCESS: {
    httpCode: 200,
    message: '루틴 정보를 불러왔어요.',
  },
  ROUTINE_UPDATE_SUCCESS: {
    httpCode: 200,
    message: '루틴이 수정됐어요.',
  },
  ROUTINE_DELETE_SUCCESS: {
    httpCode: 200,
    message: '루틴이 삭제됐어요.',
  },
  ROUTINE_ORDER_UPDATE_SUCCESS: {
    httpCode: 200,
    message: '루틴 순서가 변경됐어요.',
  },
  ROUTINE_LIST_SUCCESS: {
    httpCode: 200,
    message: '루틴 목록을 불러왔어요.',
  },
  ROUTINE_CREATE_FAILED: {
    httpCode: 500,
    message: '루틴을 추가하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'ROUTINE_CREATE_FAILED',
  },
  ROUTINE_GET_FAILED: {
    httpCode: 500,
    message:
      '루틴 정보를 불러오는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'ROUTINE_GET_FAILED',
  },
  ROUTINE_UPDATE_FAILED: {
    httpCode: 500,
    message: '루틴을 수정하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'ROUTINE_UPDATE_FAILED',
  },
  ROUTINE_DELETE_FAILED: {
    httpCode: 500,
    message: '루틴을 삭제하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'ROUTINE_DELETE_FAILED',
  },
  ROUTINE_ORDER_UPDATE_FAILED: {
    httpCode: 500,
    message:
      '루틴 순서를 변경하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'ROUTINE_ORDER_UPDATE_FAILED',
  },
  ROUTINE_LIST_FAILED: {
    httpCode: 500,
    message:
      '루틴 목록을 불러오는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'ROUTINE_LIST_FAILED',
  },
} as const satisfies Record<string, ResponseCode>;
