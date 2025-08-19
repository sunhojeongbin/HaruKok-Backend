// src/common/services/base.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ResponseBuilder } from '../builders/response.builder';
import { SuccessResponseDto, ErrorResponseDto } from '../dto/api-response.dto';
import { ResponseItem } from '../constants/response-message';

/**
 * @description 모든 서비스 클래스의 기본 클래스
 * 공통 응답 생성 메서드 및 로깅을 제공합니다.
 */
@Injectable()
export abstract class BaseService {
    protected readonly logger = new Logger(this.constructor.name);

    /**
     * @description 성공 응답 생성
     */
    protected success<T>(responseItem: ResponseItem, data?: T): SuccessResponseDto<T> {
        this.logger.log(`Success response: ${responseItem.code}`);
        return ResponseBuilder.success(responseItem, data);
    }

    /**
     * @description 데이터와 함께 성공 응답 생성
     */
    protected successWithData<T>(responseItem: ResponseItem, data: T): SuccessResponseDto<T> {
        this.logger.log(`Success response with data: ${responseItem.code}`);
        return ResponseBuilder.successWithData(responseItem, data);
    }

    /**
     * @description 단순 성공 응답 생성
     */
    protected ok(code?: string, message?: string): SuccessResponseDto {
        const responseCode = code || 'SUCCESS';
        this.logger.log(`OK response: ${responseCode}`);
        return ResponseBuilder.ok(code, message);
    }

    /**
     * @description 생성 성공 응답
     */
    protected created<T>(responseItem: ResponseItem, data?: T): SuccessResponseDto<T> {
        this.logger.log(`Created response: ${responseItem.code}`);
        return ResponseBuilder.created(responseItem, data);
    }

    /**
     * @description 에러 응답 생성 (throw 하지 않고 반환)
     */
    protected errorResponse(responseItem: ResponseItem): ErrorResponseDto {
        this.logger.error(`Error response: ${responseItem.code} - ${responseItem.message}`);
        return ResponseBuilder.error(responseItem);
    }

    /**
     * @description 안전한 비동기 실행 (에러 자동 로깅)
     */
    protected async safeExecute<T>(
        operation: () => Promise<T>,
        context: string,
        errorHandler?: (error: Error) => never,
    ): Promise<T> {
        try {
            this.logger.debug(`Executing ${context}`);
            const result = await operation();
            this.logger.debug(`Successfully executed ${context}`);
            return result;
        } catch (error) {
            this.logger.error(`Failed to execute ${context}: ${error.message}`, error.stack);

            if (errorHandler) {
                errorHandler(error);
            }
            throw error;
        }
    }

    /**
     * @description 성능 측정 래퍼
     */
    protected async measurePerformance<T>(
        operation: () => Promise<T>,
        operationName: string,
    ): Promise<T> {
        const startTime = Date.now();
        try {
            const result = await operation();
            const executionTime = Date.now() - startTime;

            if (executionTime > 1000) {
                this.logger.warn(
                    `Slow operation detected: ${operationName} took ${executionTime}ms`,
                );
            } else {
                this.logger.debug(`${operationName} completed in ${executionTime}ms`);
            }

            return result;
        } catch (error) {
            const executionTime = Date.now() - startTime;
            this.logger.error(`${operationName} failed after ${executionTime}ms: ${error.message}`);
            throw error;
        }
    }

    /**
     * @description 성공 응답 생성 (간단한 메서드)
     */
    protected createSuccessResponse<T>(data?: T, message?: string): SuccessResponseDto<T> {
        return {
            success: true,
            code: 'SUCCESS',
            message: message || '성공',
            data: data,
        } as SuccessResponseDto<T>;
    }
}

/**
 * @description 서비스 결과를 나타내는 타입
 */
export type ServiceResult<T = any> = SuccessResponseDto<T> | ErrorResponseDto;

/**
 * @description 서비스 결과가 성공인지 확인하는 타입 가드
 */
export function isSuccessResult<T>(result: ServiceResult<T>): result is SuccessResponseDto<T> {
    return result.success === true;
}

/**
 * @description 서비스 결과가 에러인지 확인하는 타입 가드
 */
export function isErrorResult(result: ServiceResult): result is ErrorResponseDto {
    return result.success === false;
}
