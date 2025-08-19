import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiResponseDto } from '../dto/api-response.dto';
import { ResponseItem } from '../constants/response-message';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const errorResponse = this.createErrorResponse(exception);

        // 로깅
        this.logError(exception, request, errorResponse);

        // 응답 전송
        response.status(errorResponse.statusCode).json(errorResponse);
    }

    /**
     * 에러 응답 생성
     */
    private createErrorResponse(exception: unknown): ApiResponseDto {
        if (exception instanceof HttpException) {
            return this.handleHttpException(exception);
        }

        return this.handleGenericError(exception);
    }

    /**
     * HTTP Exception 처리
     */
    private handleHttpException(exception: HttpException): ApiResponseDto {
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse() as any;

        // ResponseItem 구조인지 확인
        if (this.isResponseItem(exceptionResponse)) {
            return new ApiResponseDto(
                status,
                false,
                exceptionResponse.code,
                exceptionResponse.message,
                null,
                exceptionResponse.code,
            );
        }

        // 기본 HTTP Exception 처리
        const message =
            typeof exceptionResponse === 'string'
                ? exceptionResponse
                : exceptionResponse.message || exception.message;

        return new ApiResponseDto(status, false, 'HTTP_ERROR', message, null, 'HTTP_ERROR');
    }

    /**
     * 일반 에러 처리 (500)
     */
    private handleGenericError(exception: unknown): ApiResponseDto {
        const message =
            exception instanceof Error ? exception.message : '알 수 없는 서버 오류가 발생했습니다.';

        return new ApiResponseDto(
            HttpStatus.INTERNAL_SERVER_ERROR,
            false,
            'INTERNAL_SERVER_ERROR',
            message,
            null,
            'INTERNAL_SERVER_ERROR',
        );
    }

    /**
     * ResponseItem 구조인지 확인 (타입 가드)
     */
    private isResponseItem(data: any): data is ResponseItem {
        return (
            data &&
            typeof data.code === 'string' &&
            typeof data.message === 'string' &&
            typeof data.status === 'number'
        );
    }

    /**
     * 에러 로깅
     */
    private logError(exception: unknown, request: Request, errorResponse: ApiResponseDto): void {
        const { method, url } = request;
        const { statusCode, code } = errorResponse;

        console.error(`[${new Date().toISOString()}] ${method} ${url} - ${statusCode} ${code}`);

        // 500 에러는 스택 트레이스도 출력
        if (statusCode >= 500) {
            console.error('Exception details:', exception);
        }
    }
}
