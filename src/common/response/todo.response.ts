import { ResponseCode } from './response-code';

/**
 * @description 투두 도메인 응답/에러 코드 집합
 */
export const TodoResponse = {
  TODO_REPOSITORY_NOT_READY: {
    httpCode: 503,
    message:
      '투두 정보를 처리할 준비가 아직 안 됐어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'TODO_REPOSITORY_NOT_READY',
  },
  TODO_QUERY_MONTH_INVALID: {
    httpCode: 400,
    message: '조회 월 형식이 올바르지 않아요. YYYY-MM 형식으로 입력해 주세요.',
    errorCode: 'TODO_QUERY_MONTH_INVALID',
  },
  TODO_CATEGORY_NOT_FOUND: {
    httpCode: 404,
    message: '카테고리를 찾지 못했어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'TODO_CATEGORY_NOT_FOUND',
  },
  TODO_CONTENT_INVALID: {
    httpCode: 400,
    message: '투두 내용은 1~255자로 입력해 주세요.',
    errorCode: 'TODO_CONTENT_INVALID',
  },
  TODO_MEMO_INVALID: {
    httpCode: 400,
    message: '메모는 1000자 이하로 입력해 주세요.',
    errorCode: 'TODO_MEMO_INVALID',
  },
  TODO_DATE_INVALID: {
    httpCode: 400,
    message:
      '투두 날짜 형식이 올바르지 않아요. YYYY-MM-DD 형식으로 입력해 주세요.',
    errorCode: 'TODO_DATE_INVALID',
  },
  TODO_SEARCH_KEYWORD_INVALID: {
    httpCode: 400,
    message: '검색어는 공백 없이 1~255자로 입력해 주세요.',
    errorCode: 'TODO_SEARCH_KEYWORD_INVALID',
  },
  TODO_UPDATE_PAYLOAD_EMPTY: {
    httpCode: 400,
    message: '수정할 항목(카테고리, 내용, 메모)을 1개 이상 입력해 주세요.',
    errorCode: 'TODO_UPDATE_PAYLOAD_EMPTY',
  },
  TODO_REPEAT_DATE_INVALID: {
    httpCode: 400,
    message:
      '투두 반복 날짜 형식이 올바르지 않아요. YYYY-MM-DD 형식으로 다시 확인해 주세요.',
    errorCode: 'TODO_REPEAT_DATE_INVALID',
  },
  TODO_REPEAT_TODAY_SOURCE_INVALID: {
    httpCode: 400,
    message:
      '오늘 또 하기는 오늘이 아닌 날짜의 투두에서만 가능해요. 다른 날짜의 투두를 선택해 주세요.',
    errorCode: 'TODO_REPEAT_TODAY_SOURCE_INVALID',
  },
  TODO_REPEAT_TOMORROW_SOURCE_INVALID: {
    httpCode: 400,
    message:
      '내일 또 하기는 오늘 날짜의 투두에서만 가능해요. 오늘 투두를 선택해 주세요.',
    errorCode: 'TODO_REPEAT_TOMORROW_SOURCE_INVALID',
  },
  TODO_REPEAT_TARGET_SAME_AS_SOURCE: {
    httpCode: 400,
    message:
      '다음에 또 하기는 원본과 다른 날짜만 선택할 수 있어요. 다른 날짜를 선택해 주세요.',
    errorCode: 'TODO_REPEAT_TARGET_SAME_AS_SOURCE',
  },
  TODO_NOT_FOUND: {
    httpCode: 404,
    message: '투두를 찾지 못했어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'TODO_NOT_FOUND',
  },
  TODO_CREATE_SUCCESS: {
    httpCode: 201,
    message: '투두가 추가됐어요.',
  },
  TODO_COMPLETION_UPDATE_SUCCESS: {
    httpCode: 200,
    message: '투두 완료 상태가 변경됐어요.',
  },
  TODO_UPDATE_SUCCESS: {
    httpCode: 200,
    message: '투두가 수정됐어요.',
  },
  TODO_GET_SUCCESS: {
    httpCode: 200,
    message: '투두 정보를 불러왔어요.',
  },
  TODO_LIST_SUCCESS: {
    httpCode: 200,
    message: '투두 목록을 불러왔어요.',
  },
  TODO_SEARCH_SUCCESS: {
    httpCode: 200,
    message: '투두 검색 결과를 불러왔어요.',
  },
  TODO_DELETE_SUCCESS: {
    httpCode: 200,
    message: '투두가 삭제됐어요.',
  },
  TODO_REPEAT_TODAY_SUCCESS: {
    httpCode: 201,
    message: '오늘 또 하기 투두가 추가됐어요.',
  },
  TODO_REPEAT_TOMORROW_SUCCESS: {
    httpCode: 201,
    message: '내일 또 하기 투두가 추가됐어요.',
  },
  TODO_REPEAT_NEXT_SUCCESS: {
    httpCode: 201,
    message: '다음에 또 하기 투두가 추가됐어요.',
  },
  TODO_CREATE_FAILED: {
    httpCode: 500,
    message: '투두를 추가하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'TODO_CREATE_FAILED',
  },
  TODO_LIST_FAILED: {
    httpCode: 500,
    message:
      '투두 목록을 불러오는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'TODO_LIST_FAILED',
  },
  TODO_SEARCH_FAILED: {
    httpCode: 500,
    message: '투두를 검색하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'TODO_SEARCH_FAILED',
  },
  TODO_COMPLETION_UPDATE_FAILED: {
    httpCode: 500,
    message:
      '투두 완료 상태를 변경하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'TODO_COMPLETION_UPDATE_FAILED',
  },
  TODO_UPDATE_FAILED: {
    httpCode: 500,
    message: '투두를 수정하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'TODO_UPDATE_FAILED',
  },
  TODO_GET_FAILED: {
    httpCode: 500,
    message:
      '투두 정보를 불러오는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'TODO_GET_FAILED',
  },
  TODO_DELETE_FAILED: {
    httpCode: 500,
    message: '투두를 삭제하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'TODO_DELETE_FAILED',
  },
  TODO_REPEAT_TODAY_FAILED: {
    httpCode: 500,
    message:
      '오늘 또 하기를 처리하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'TODO_REPEAT_TODAY_FAILED',
  },
  TODO_REPEAT_TOMORROW_FAILED: {
    httpCode: 500,
    message:
      '내일 또 하기를 처리하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'TODO_REPEAT_TOMORROW_FAILED',
  },
  TODO_REPEAT_NEXT_FAILED: {
    httpCode: 500,
    message:
      '다음에 또 하기를 처리하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'TODO_REPEAT_NEXT_FAILED',
  },
} as const satisfies Record<string, ResponseCode>;
