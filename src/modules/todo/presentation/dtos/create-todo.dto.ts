import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * @description 투두 생성 요청 DTO
 */
export class CreateTodoDto {
  @ApiProperty({
    description: '선택한 카테고리 ID',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsUUID('4')
  ctgId: string;

  @ApiProperty({
    description: '할 일 내용',
    example: '러닝 5km',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  content: string;

  @ApiPropertyOptional({
    description: '투두 메모 (선택)',
    example: '아침 7시 한강',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  memo?: string;

  @ApiPropertyOptional({
    description:
      '투두 날짜 (YYYY-MM-DD). 미입력 시 서버 기준 오늘 날짜로 생성됩니다.',
    example: '2026-04-05',
  })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
  todoDate?: string;
}
