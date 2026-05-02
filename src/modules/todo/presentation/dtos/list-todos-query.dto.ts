import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

/**
 * @description 로그인 사용자 투두 목록 조회 쿼리 DTO
 */
export class ListTodosQueryDto {
  @ApiPropertyOptional({
    description: '조회할 년-월 (YYYY-MM). 미입력 시 서버 현재 월로 조회합니다.',
    example: '2026-03',
  })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: '조회 월은 YYYY-MM 형식으로 입력해 주세요' })
  yearMonth?: string;
}
