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
  @ArrayNotEmpty({ message: '카테고리 ID는 1개 이상 입력해 주세요' })
  @ArrayMaxSize(10, { message: '카테고리는 최대 10개까지 정렬할 수 있어요' })
  @ArrayUnique({ message: '카테고리 ID가 중복되었습니다' })
  @IsUUID('4', { each: true, message: '올바른 카테고리 ID 형식이 아닙니다' })
  ctgIds: string[];
}
