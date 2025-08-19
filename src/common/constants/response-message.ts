/**
 * @description 응답 메시지
 */
export const ResponseMessage = {
    SUCCESS: {
        // 공통 성공 메시지
        OK: { code: 'SUCCESS', message: '요청이 성공적으로 처리되었습니다.', status: 200 },
        CREATED: { code: 'CREATED', message: '리소스가 성공적으로 생성되었습니다.', status: 201 },

        // 사용자 관련
        USER_CREATE: { code: 'USER_CREATE_SUCCESS', message: '사용자 추가 성공', status: 201 },
        USER_FIND_ALL: {
            code: 'USER_FIND_ALL_SUCCESS',
            message: '사용자 목록 조회 성공',
            status: 200,
        },
        USER_FIND_ONE: { code: 'USER_FIND_ONE_SUCCESS', message: '사용자 조회 성공', status: 200 },
        USER_UPDATE: { code: 'USER_UPDATE_SUCCESS', message: '사용자 정보 수정 성공', status: 200 },
        USER_DELETE: { code: 'USER_DELETE_SUCCESS', message: '사용자 삭제 성공', status: 200 },

        // 인증 관련
        AUTH_LOGIN: { code: 'AUTH_LOGIN_SUCCESS', message: '로그인 성공', status: 200 },
        AUTH_LOGOUT: { code: 'AUTH_LOGOUT_SUCCESS', message: '로그아웃 성공', status: 200 },
        AUTH_REFRESH: { code: 'AUTH_REFRESH_SUCCESS', message: '토큰 갱신 성공', status: 200 },
    },
    ERROR: {
        // 공통 에러
        BAD_REQUEST: { code: 'BAD_REQUEST', message: '잘못된 요청입니다.', status: 400 },
        UNAUTHORIZED: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.', status: 401 },
        FORBIDDEN: { code: 'FORBIDDEN', message: '접근 권한이 없습니다.', status: 403 },
        NOT_FOUND: { code: 'NOT_FOUND', message: '요청한 리소스를 찾을 수 없습니다.', status: 404 },
        CONFLICT: { code: 'CONFLICT', message: '리소스 충돌이 발생했습니다.', status: 409 },
        INTERNAL_SERVER_ERROR: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '내부 서버 오류가 발생했습니다.',
            status: 500,
        },

        // 사용자 관련 에러
        USER_NOT_FOUND: {
            code: 'USER_NOT_FOUND',
            message: '사용자를 찾을 수 없습니다.',
            status: 404,
        },
        USER_ALREADY_EXISTS: {
            code: 'USER_ALREADY_EXISTS',
            message: '이미 존재하는 사용자입니다.',
            status: 409,
        },
        USER_INVALID_CREDENTIALS: {
            code: 'USER_INVALID_CREDENTIALS',
            message: '잘못된 사용자 정보입니다.',
            status: 400,
        },

        // 인증 관련 에러
        AUTH_INVALID_TOKEN: {
            code: 'AUTH_INVALID_TOKEN',
            message: '유효하지 않은 토큰입니다.',
            status: 401,
        },
        AUTH_TOKEN_EXPIRED: {
            code: 'AUTH_TOKEN_EXPIRED',
            message: '토큰이 만료되었습니다.',
            status: 401,
        },
        AUTH_INVALID_CREDENTIALS: {
            code: 'AUTH_INVALID_CREDENTIALS',
            message: '잘못된 인증 정보입니다.',
            status: 401,
        },

        // 시스템 에러
        DATABASE_ERROR: {
            code: 'DATABASE_ERROR',
            message: '데이터베이스 연결 오류가 발생했습니다.',
            status: 500,
        },
        VALIDATION_ERROR: {
            code: 'VALIDATION_ERROR',
            message: '입력값 검증에 실패했습니다.',
            status: 400,
        },
    },
} as const;

export type ResponseItem = { code: string; message: string; status: number };

/**
 * @description 응답 메시지 코드 반환 함수
 * @param item - 응답 메시지 아이템
 * @returns {string} - 응답 메시지 코드
 */
export function getCode(item: ResponseItem): string {
    return item.code;
}

/**
 * @description 응답 메시지 반환 함수
 * @param item - 응답 메시지 아이템
 * @returns {string} - 응답 메시지
 */
export function getMessage(item: ResponseItem): string {
    return item.message;
}
