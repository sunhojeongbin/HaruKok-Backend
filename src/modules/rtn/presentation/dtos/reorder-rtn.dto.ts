import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsUUID } from 'class-validator';

/**
 * @description 루틴 순서 변경 요청 DTO
 */
export class ReorderRtnDto {
  @ApiProperty({
    description: '순서를 변경할 카테고리 ID',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsUUID('4')
  ctgId: string;

  @ApiProperty({
    description: '해당 카테고리의 정렬된 루틴 ID 배열(맨 앞이 0순위)',
    example: [
      '70ff2f32-2dcd-4a59-8a66-c13e4f500001',
      '70ff2f32-2dcd-4a59-8a66-c13e4f500002',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  rtnIds: string[];
}
