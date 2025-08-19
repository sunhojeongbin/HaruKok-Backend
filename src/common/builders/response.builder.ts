import { HttpStatus } from '@nestjs/common';
import { SuccessResponseDto, ErrorResponseDto } from '../dto/api-response.dto';
import { ResponseItem } from '../constants/response-message';

/**
 * @description API 응답을 일관성 있게 생성하는 빌더 클래스
 */
export class ResponseBuilder {
    /**
     * @description 성공 응답 생성
     * @param responseItem - 응답 메시지 아이템
     * @param data - 응답 데이터 (선택적)
     */
    static success<T>(responseItem: ResponseItem, data?: T): SuccessResponseDto<T> {
        return new SuccessResponseDto(
            responseItem.code,
            responseItem.message,
            data,
            responseItem.status,
        );
    }

    /**
     * @description 데이터와 함께 성공 응답 생성
     * @param responseItem - 응답 메시지 아이템
     * @param data - 응답 데이터
     */
    static successWithData<T>(responseItem: ResponseItem, data: T): SuccessResponseDto<T> {
        return new SuccessResponseDto(
            responseItem.code,
            responseItem.message,
            data,
            responseItem.status,
        );
    }

    /**
     * @description 단순 성공 응답 생성 (데이터 없음)
     * @param code - 응답 코드
     * @param message - 응답 메시지
     * @param statusCode - HTTP 상태 코드 (기본값: 200)
     */
    static ok(
        code: string = 'SUCCESS',
        message: string = '요청이 성공적으로 처리되었습니다.',
        statusCode: number = HttpStatus.OK,
    ): SuccessResponseDto {
        return new SuccessResponseDto(code, message, null, statusCode);
    }

    /**
     * @description 생성 성공 응답 (201)
     * @param responseItem - 응답 메시지 아이템
     * @param data - 생성된 데이터
     */
    static created<T>(responseItem: ResponseItem, data?: T): SuccessResponseDto<T> {
        return new SuccessResponseDto(
            responseItem.code,
            responseItem.message,
            data,
            HttpStatus.CREATED,
        );
    }

    /**
     * @description 에러 응답 생성
     * @param responseItem - 응답 메시지 아이템
     */
    static error(responseItem: ResponseItem): ErrorResponseDto {
        return new ErrorResponseDto(
            responseItem.code,
            responseItem.message,
            responseItem.status,
            responseItem.code,
        );
    }

    /**
     * @description 커스텀 에러 응답 생성
     * @param code - 에러 코드
     * @param message - 에러 메시지
     * @param statusCode - HTTP 상태 코드 (기본값: 500)
     */
    static customError(
        code: string,
        message: string,
        statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    ): ErrorResponseDto {
        return new ErrorResponseDto(code, message, statusCode, code);
    }
}

/**
 * @description 응답 빌더의 단축 함수들
 */
export const Response = {
    success: ResponseBuilder.success,
    successWithData: ResponseBuilder.successWithData,
    ok: ResponseBuilder.ok,
    created: ResponseBuilder.created,
    error: ResponseBuilder.error,
    customError: ResponseBuilder.customError,
} as const;
