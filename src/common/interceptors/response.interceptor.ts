// src/common/interceptors/response.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';
import { ResponseItem } from '../constants/response-message';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
        const response = context.switchToHttp().getResponse();

        return next.handle().pipe(
            map((data: any) => {
                // 1. 이미 ApiResponseDto 형태인 경우 - 가장 빠른 경로
                if (this.isApiResponseDto(data)) {
                    response.status(data.statusCode);
                    return data;
                }

                // 2. ResponseItem 구조인 경우 - 비즈니스 로직 응답
                if (this.isResponseItem(data)) {
                    return this.createResponseFromItem(data, response);
                }

                // 3. 일반 데이터인 경우 - 기본 성공 응답
                return this.createDefaultSuccessResponse(data, response);
            }),
        );
    }

    /**
     * ApiResponseDto 타입인지 확인 (타입 가드)
     */
    private isApiResponseDto(data: any): data is ApiResponseDto {
        return (
            data &&
            typeof data === 'object' &&
            typeof data.statusCode === 'number' &&
            typeof data.success === 'boolean'
        );
    }

    /**
     * ResponseItem 구조인지 확인 (타입 가드)
     */
    private isResponseItem(data: any): data is ResponseItem & { data?: any } {
        return (
            data &&
            typeof data.code === 'string' &&
            typeof data.message === 'string' &&
            typeof data.status === 'number'
        );
    }

    /**
     * ResponseItem으로부터 ApiResponseDto 생성
     */
    private createResponseFromItem(
        data: ResponseItem & { data?: any },
        response: any,
    ): ApiResponseDto<T> {
        response.status(data.status);

        return new ApiResponseDto(
            data.status,
            data.status < 400,
            data.code,
            data.message,
            data.data ?? null,
            undefined,
        );
    }

    /**
     * 기본 성공 응답 생성
     */
    private createDefaultSuccessResponse(data: any, response: any): ApiResponseDto<T> {
        const statusCode = 200;
        response.status(statusCode);

        return new ApiResponseDto(
            statusCode,
            true,
            'SUCCESS',
            '요청이 성공적으로 처리되었습니다.',
            data,
            undefined,
        );
    }
}
