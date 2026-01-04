import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ description: 'HTTP 상태 코드' })
  httpCode: number;

  @ApiProperty({ description: '응답 메시지' })
  message: string;

  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiProperty({ description: '에러 코드', required: false })
  errorCode?: string;

  @ApiProperty({ description: '응답 데이터', required: false })
  data?: T;

  constructor(
    httpCode: number,
    message: string,
    success: boolean,
    data?: T,
    errorCode?: string,
  ) {
    this.httpCode = httpCode;
    this.message = message;
    this.success = success;
    this.data = data;
    this.errorCode = errorCode;
  }

  static success<T>(
    data: T,
    message = '성공',
    httpCode = 200,
  ): ApiResponseDto<T> {
    return new ApiResponseDto(httpCode, message, true, data);
  }

  static error(
    message: string,
    httpCode = 500,
    errorCode?: string,
  ): ApiResponseDto<null> {
    return new ApiResponseDto<null>(httpCode, message, false, null, errorCode);
  }
}
