import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsUUID,
} from 'class-validator';

/**
 * @description 카테고리 순서 일괄 변경 요청 DTO
 */
export class ReorderCtgDto {
  @ApiProperty({
    description: '정렬된 카테고리 ID 배열(맨 앞이 0순위)',
    example: [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
    ],
    maxItems: 10,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  ctgIds: string[];
}
