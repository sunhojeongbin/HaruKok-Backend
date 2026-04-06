import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/**
 * @description 투두 수정 요청 DTO
 */
export class UpdateTodoDto {
  @ApiPropertyOptional({
    description: '수정할 카테고리 ID',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsOptional()
  @IsUUID('4')
  ctgId?: string;

  @ApiPropertyOptional({
    description: '수정할 할 일 내용',
    example: '러닝 7km',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  content?: string;

  @ApiPropertyOptional({
    description: '수정할 메모 (빈 문자열/공백만 입력하면 메모가 삭제됩니다.)',
    example: '저녁 8시, 인터벌 포함',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  memo?: string;
}
