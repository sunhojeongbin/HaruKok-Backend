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
  TODO_CREATE_SUCCESS: {
    httpCode: 201,
    message: '투두가 생성되었습니다.',
  },
  TODO_LIST_SUCCESS: {
    httpCode: 200,
    message: '투두 목록 조회에 성공했습니다.',
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
} as const satisfies Record<string, ResponseCode>;
