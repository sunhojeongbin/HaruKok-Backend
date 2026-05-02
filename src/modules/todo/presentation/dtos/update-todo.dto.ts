import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { StripHtml } from '../../../../common/decorators/strip-html.decorator';

/**
 * @description 투두 수정 요청 DTO
 */
export class UpdateTodoDto {
  @ApiPropertyOptional({
    description: '수정할 카테고리 ID',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsOptional()
  @IsUUID('4', { message: '올바른 카테고리 ID 형식이 아닙니다' })
  ctgId?: string;

  @ApiPropertyOptional({
    description: '수정할 할 일 내용',
    example: '러닝 7km',
    maxLength: 255,
  })
  @IsOptional()
  @StripHtml()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255, { message: '할 일 내용은 255자 이하로 입력해 주세요' })
  content?: string;

  @ApiPropertyOptional({
    description: '수정할 메모 (빈 문자열/공백만 입력하면 메모가 삭제됩니다.)',
    example: '저녁 8시, 인터벌 포함',
    maxLength: 1000,
  })
  @IsOptional()
  @StripHtml()
  @IsString()
  @MaxLength(1000, { message: '메모는 1000자 이하로 입력해 주세요' })
  memo?: string;
}
