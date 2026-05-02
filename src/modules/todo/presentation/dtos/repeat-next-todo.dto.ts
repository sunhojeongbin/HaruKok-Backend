import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsString,
  Matches,
} from 'class-validator';

/**
 * @description 다음에 또 하기(다중 날짜 복제) 요청 DTO
 */
export class RepeatNextTodoDto {
  @ApiProperty({
    description: '복제할 대상 날짜 목록 (YYYY-MM-DD, 최소 1개)',
    example: ['2026-03-30', '2026-04-02'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: '날짜는 1개 이상 입력해 주세요' })
  @ArrayUnique({ message: '날짜가 중복되었습니다' })
  @IsString({ each: true })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
    each: true,
    message: '날짜는 YYYY-MM-DD 형식으로 입력해 주세요',
  })
  dates: string[];
}
