import { ResponseCode } from './response-code';

export const CtgResponse = {
  CATEGORY_REPOSITORY_NOT_READY: {
    httpCode: 503,
    message: '카테고리 저장소가 준비되지 않았습니다.',
    errorCode: 'CATEGORY_REPOSITORY_NOT_READY',
  },
  CATEGORY_NAME_INVALID: {
    httpCode: 400,
    message: '카테고리 이름은 공백이 아닌 1~10자여야 합니다.',
    errorCode: 'CATEGORY_NAME_INVALID',
  },
  CATEGORY_LIMIT_EXCEEDED: {
    httpCode: 400,
    message: '카테고리는 사용자당 최대 10개까지 생성할 수 있습니다.',
    errorCode: 'CATEGORY_LIMIT_EXCEEDED',
  },
  CATEGORY_NAME_DUPLICATED: {
    httpCode: 409,
    message: '이미 존재하는 카테고리 이름입니다.',
    errorCode: 'CATEGORY_NAME_DUPLICATED',
  },
  CATEGORY_NOT_FOUND: {
    httpCode: 404,
    message: '카테고리를 찾을 수 없습니다.',
    errorCode: 'CATEGORY_NOT_FOUND',
  },
  CATEGORY_ORDER_INVALID: {
    httpCode: 400,
    message: '유효하지 않은 카테고리 정렬 순서입니다.',
    errorCode: 'CATEGORY_ORDER_INVALID',
  },
  CATEGORY_CREATE_SUCCESS: {
    httpCode: 201,
    message: '카테고리가 생성되었습니다.',
  },
  CATEGORY_UPDATE_SUCCESS: {
    httpCode: 200,
    message: '카테고리가 수정되었습니다.',
  },
  CATEGORY_DELETE_SUCCESS: {
    httpCode: 200,
    message: '카테고리가 삭제되었습니다.',
  },
  CATEGORY_ORDER_UPDATE_SUCCESS: {
    httpCode: 200,
    message: '카테고리 정렬 순서가 변경되었습니다.',
  },
  CATEGORY_LIST_SUCCESS: {
    httpCode: 200,
    message: '카테고리 목록 조회에 성공했습니다.',
  },
  CATEGORY_GET_SUCCESS: {
    httpCode: 200,
    message: '카테고리 조회에 성공했습니다.',
  },
  CATEGORY_CREATE_FAILED: {
    httpCode: 500,
    message: '카테고리 생성 중 오류가 발생했습니다.',
    errorCode: 'CATEGORY_CREATE_FAILED',
  },
  CATEGORY_UPDATE_FAILED: {
    httpCode: 500,
    message: '카테고리 수정 중 오류가 발생했습니다.',
    errorCode: 'CATEGORY_UPDATE_FAILED',
  },
  CATEGORY_DELETE_FAILED: {
    httpCode: 500,
    message: '카테고리 삭제 중 오류가 발생했습니다.',
    errorCode: 'CATEGORY_DELETE_FAILED',
  },
  CATEGORY_ORDER_UPDATE_FAILED: {
    httpCode: 500,
    message: '카테고리 정렬 순서 변경 중 오류가 발생했습니다.',
    errorCode: 'CATEGORY_ORDER_UPDATE_FAILED',
  },
} as const satisfies Record<string, ResponseCode>;
