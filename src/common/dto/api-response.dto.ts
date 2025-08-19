// src/common/dto/api-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

/**
 * @description 기본 API 응답 형태
 */
export class ApiResponseDto<T = any> {
    @ApiProperty({ description: 'HTTP 상태 코드' })
    statusCode: number;

    @ApiProperty({ description: '성공 여부' })
    success: boolean;

    @ApiProperty({ description: '응답 코드' })
    code: string;

    @ApiProperty({ description: '응답 메시지' })
    message: string;

    @ApiProperty({ description: '에러 코드 (에러 시에만)', required: false })
    errorCode?: string;

    @ApiProperty({ description: '응답 데이터', required: false })
    data?: T;

    constructor(
        statusCode: number,
        success: boolean,
        code: string,
        message: string,
        data?: T,
        errorCode?: string,
    ) {
        this.statusCode = statusCode;
        this.success = success;
        this.code = code;
        this.message = message;
        this.data = data;
        this.errorCode = errorCode;
    }
}

/**
 * @description 성공 응답을 위한 DTO
 */
export class SuccessResponseDto<T = any> extends ApiResponseDto<T> {
    @ApiProperty({ description: '성공 여부', default: true })
    success: true;

    constructor(code: string, message: string, data?: T, statusCode: number = 200) {
        super(statusCode, true, code, message, data, undefined);
    }
}

/**
 * @description 에러 응답을 위한 DTO
 */
export class ErrorResponseDto extends ApiResponseDto {
    @ApiProperty({ description: '성공 여부', default: false })
    success: false;

    @ApiProperty({ description: '에러 코드' })
    errorCode: string;

    constructor(code: string, message: string, statusCode: number = 500, errorCode?: string) {
        super(statusCode, false, code, message, null, errorCode || code);
    }
}
