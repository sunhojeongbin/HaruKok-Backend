import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponseDto<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T>> {
    return next.handle().pipe(
      map((data: T | ApiResponseDto<T>) => {
        const response = context.switchToHttp().getResponse<Response>();
        const statusCode: number = response.statusCode;

        // 이미 ApiResponseDto 형식이면 그대로 반환
        if (data instanceof ApiResponseDto) {
          return data;
        }

        // 일반 데이터를 ApiResponseDto 형식으로 변환
        return ApiResponseDto.success<T>(data, '성공', statusCode);
      }),
    );
  }
}
