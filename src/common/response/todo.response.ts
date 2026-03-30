import { ResponseCode } from './response-code';

/**
 * @description 투두 도메인 응답/에러 코드 집합
 */
export const TodoResponse = {
  TODO_REPOSITORY_NOT_READY: {
    httpCode: 503,
    message: '투두 저장소가 준비되지 않았습니다.',
    errorCode: 'TODO_REPOSITORY_NOT_READY',
  },
  TODO_QUERY_MONTH_INVALID: {
    httpCode: 400,
    message: '조회 월 형식이 올바르지 않습니다. (YYYY-MM)',
    errorCode: 'TODO_QUERY_MONTH_INVALID',
  },
  TODO_CATEGORY_NOT_FOUND: {
    httpCode: 404,
    message: '사용자의 카테고리를 찾을 수 없습니다.',
    errorCode: 'TODO_CATEGORY_NOT_FOUND',
  },
  TODO_CONTENT_INVALID: {
    httpCode: 400,
    message: '투두 내용은 1~255자로 입력해주세요.',
    errorCode: 'TODO_CONTENT_INVALID',
  },
  TODO_MEMO_INVALID: {
    httpCode: 400,
    message: '메모는 최대 1000자까지 입력할 수 있습니다.',
    errorCode: 'TODO_MEMO_INVALID',
  },
  TODO_UPDATE_PAYLOAD_EMPTY: {
    httpCode: 400,
    message: '수정할 항목(ctgId, content, memo) 중 최소 1개는 필요합니다.',
    errorCode: 'TODO_UPDATE_PAYLOAD_EMPTY',
  },
  TODO_REPEAT_DATE_INVALID: {
    httpCode: 400,
    message: '유효하지 않은 날짜가 포함되어 있습니다. (YYYY-MM-DD)',
    errorCode: 'TODO_REPEAT_DATE_INVALID',
  },
  TODO_REPEAT_TODAY_SOURCE_INVALID: {
    httpCode: 400,
    message: '오늘 또 하기는 오늘이 아닌 날짜의 투두만 가능합니다.',
    errorCode: 'TODO_REPEAT_TODAY_SOURCE_INVALID',
  },
  TODO_REPEAT_TOMORROW_SOURCE_INVALID: {
    httpCode: 400,
    message: '내일 또 하기는 오늘 날짜의 투두만 가능합니다.',
    errorCode: 'TODO_REPEAT_TOMORROW_SOURCE_INVALID',
  },
  TODO_REPEAT_TARGET_SAME_AS_SOURCE: {
    httpCode: 400,
    message: '다음에 또 하기는 원본과 다른 날짜만 선택할 수 있습니다.',
    errorCode: 'TODO_REPEAT_TARGET_SAME_AS_SOURCE',
  },
  TODO_NOT_FOUND: {
    httpCode: 404,
    message: '투두를 찾을 수 없습니다.',
    errorCode: 'TODO_NOT_FOUND',
  },
  TODO_CREATE_SUCCESS: {
    httpCode: 201,
    message: '투두가 생성되었습니다.',
  },
  TODO_COMPLETION_UPDATE_SUCCESS: {
    httpCode: 200,
    message: '투두 완료 상태가 변경되었습니다.',
  },
  TODO_UPDATE_SUCCESS: {
    httpCode: 200,
    message: '투두가 수정되었습니다.',
  },
  TODO_LIST_SUCCESS: {
    httpCode: 200,
    message: '투두 목록 조회에 성공했습니다.',
  },
  TODO_DELETE_SUCCESS: {
    httpCode: 200,
    message: '투두가 삭제되었습니다.',
  },
  TODO_REPEAT_TODAY_SUCCESS: {
    httpCode: 201,
    message: '오늘 또 하기 투두가 추가되었습니다.',
  },
  TODO_REPEAT_TOMORROW_SUCCESS: {
    httpCode: 201,
    message: '내일 또 하기 투두가 추가되었습니다.',
  },
  TODO_REPEAT_NEXT_SUCCESS: {
    httpCode: 201,
    message: '다음에 또 하기 투두가 추가되었습니다.',
  },
  TODO_CREATE_FAILED: {
    httpCode: 500,
    message: '투두 생성 중 오류가 발생했습니다.',
    errorCode: 'TODO_CREATE_FAILED',
  },
  TODO_LIST_FAILED: {
    httpCode: 500,
    message: '투두 목록 조회 중 오류가 발생했습니다.',
    errorCode: 'TODO_LIST_FAILED',
  },
  TODO_COMPLETION_UPDATE_FAILED: {
    httpCode: 500,
    message: '투두 완료 상태 변경 중 오류가 발생했습니다.',
    errorCode: 'TODO_COMPLETION_UPDATE_FAILED',
  },
  TODO_UPDATE_FAILED: {
    httpCode: 500,
    message: '투두 수정 중 오류가 발생했습니다.',
    errorCode: 'TODO_UPDATE_FAILED',
  },
  TODO_DELETE_FAILED: {
    httpCode: 500,
    message: '투두 삭제 중 오류가 발생했습니다.',
    errorCode: 'TODO_DELETE_FAILED',
  },
  TODO_REPEAT_TODAY_FAILED: {
    httpCode: 500,
    message: '오늘 또 하기 처리 중 오류가 발생했습니다.',
    errorCode: 'TODO_REPEAT_TODAY_FAILED',
  },
  TODO_REPEAT_TOMORROW_FAILED: {
    httpCode: 500,
    message: '내일 또 하기 처리 중 오류가 발생했습니다.',
    errorCode: 'TODO_REPEAT_TOMORROW_FAILED',
  },
  TODO_REPEAT_NEXT_FAILED: {
    httpCode: 500,
    message: '다음에 또 하기 처리 중 오류가 발생했습니다.',
    errorCode: 'TODO_REPEAT_NEXT_FAILED',
  },
} as const satisfies Record<string, ResponseCode>;
