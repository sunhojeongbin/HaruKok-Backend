import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * @description 투두 검색 쿼리 DTO
 */
export class SearchTodosQueryDto {
  @ApiProperty({
    description: '검색 키워드(투두 내용 기준)',
    example: '강릉 여행',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  keyword: string;
}
