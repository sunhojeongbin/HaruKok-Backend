import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { StripHtml } from '../../../../common/decorators/strip-html.decorator';

/**
 * @description 투두 생성 요청 DTO
 */
export class CreateTodoDto {
  @ApiProperty({
    description: '선택한 카테고리 ID',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsUUID('4', { message: '올바른 카테고리 ID 형식이 아닙니다' })
  ctgId: string;

  @ApiProperty({
    description: '할 일 내용',
    example: '러닝 5km',
    maxLength: 255,
  })
  @StripHtml()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255, { message: '할 일 내용은 255자 이하로 입력해 주세요' })
  content: string;

  @ApiPropertyOptional({
    description: '투두 메모 (선택)',
    example: '아침 7시 한강',
    maxLength: 1000,
  })
  @IsOptional()
  @StripHtml()
  @IsString()
  @MaxLength(1000, { message: '메모는 1000자 이하로 입력해 주세요' })
  memo?: string;

  @ApiPropertyOptional({
    description:
      '투두 날짜 (YYYY-MM-DD). 미입력 시 서버 기준 오늘 날짜로 생성됩니다.',
    example: '2026-04-05',
  })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
    message: '투두 날짜는 YYYY-MM-DD 형식으로 입력해 주세요',
  })
  todoDate?: string;
}
