import { ResponseCode } from './response-code';

/**
 * @description 카테고리 도메인 응답/에러 코드 집합
 */
export const CtgResponse = {
  CATEGORY_REPOSITORY_NOT_READY: {
    httpCode: 503,
    message:
      '카테고리 정보를 처리할 준비가 아직 안 됐어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'CATEGORY_REPOSITORY_NOT_READY',
  },
  CATEGORY_NAME_INVALID: {
    httpCode: 400,
    message: '카테고리 이름은 공백 없이 1~10자로 입력해 주세요.',
    errorCode: 'CATEGORY_NAME_INVALID',
  },
  CATEGORY_LIMIT_EXCEEDED: {
    httpCode: 400,
    message: '카테고리는 최대 10개까지 추가할 수 있어요.',
    errorCode: 'CATEGORY_LIMIT_EXCEEDED',
  },
  CATEGORY_NAME_DUPLICATED: {
    httpCode: 409,
    message: '이미 있는 카테고리 이름이에요. 다른 이름으로 입력해 주세요.',
    errorCode: 'CATEGORY_NAME_DUPLICATED',
  },
  CATEGORY_NOT_FOUND: {
    httpCode: 404,
    message: '카테고리를 찾지 못했어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'CATEGORY_NOT_FOUND',
  },
  CATEGORY_ORDER_INVALID: {
    httpCode: 400,
    message: '카테고리 순서가 올바르지 않아요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'CATEGORY_ORDER_INVALID',
  },
  CATEGORY_CREATE_SUCCESS: {
    httpCode: 201,
    message: '카테고리가 추가됐어요.',
  },
  CATEGORY_UPDATE_SUCCESS: {
    httpCode: 200,
    message: '카테고리가 수정됐어요.',
  },
  CATEGORY_DELETE_SUCCESS: {
    httpCode: 200,
    message: '카테고리가 삭제됐어요.',
  },
  CATEGORY_ORDER_UPDATE_SUCCESS: {
    httpCode: 200,
    message: '카테고리 순서가 변경됐어요.',
  },
  CATEGORY_LIST_SUCCESS: {
    httpCode: 200,
    message: '카테고리 목록을 불러왔어요.',
  },
  CATEGORY_GET_SUCCESS: {
    httpCode: 200,
    message: '카테고리 정보를 불러왔어요.',
  },
  CATEGORY_CREATE_FAILED: {
    httpCode: 500,
    message:
      '카테고리를 추가하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'CATEGORY_CREATE_FAILED',
  },
  CATEGORY_UPDATE_FAILED: {
    httpCode: 500,
    message:
      '카테고리를 수정하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'CATEGORY_UPDATE_FAILED',
  },
  CATEGORY_DELETE_FAILED: {
    httpCode: 500,
    message:
      '카테고리를 삭제하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'CATEGORY_DELETE_FAILED',
  },
  CATEGORY_ORDER_UPDATE_FAILED: {
    httpCode: 500,
    message:
      '카테고리 순서를 변경하는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    errorCode: 'CATEGORY_ORDER_UPDATE_FAILED',
  },
} as const satisfies Record<string, ResponseCode>;
