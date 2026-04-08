import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RptType } from '../../enums/rpt-type.enum';

/**
 * @description 루틴 수정 요청 DTO
 */
export class UpdateRtnDto {
  @ApiPropertyOptional({
    description: '수정할 카테고리 ID',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsOptional()
  @IsUUID('4')
  ctgId?: string;

  @ApiPropertyOptional({
    description: '수정할 루틴 내용',
    example: '아침 스트레칭 20분',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  rtnContent?: string;

  @ApiPropertyOptional({
    description: '수정할 시작 날짜 (YYYY-MM-DD)',
    example: '2026-04-01',
  })
  @IsOptional()
  @IsDateString()
  startDt?: string;

  @ApiPropertyOptional({
    description: '수정할 종료 날짜 (YYYY-MM-DD)',
    example: '2026-06-30',
  })
  @IsOptional()
  @IsDateString()
  endDt?: string;

  @ApiPropertyOptional({
    description: '수정할 반복 주기',
    enum: RptType,
    example: RptType.WEEKLY,
  })
  @IsOptional()
  @IsEnum(RptType)
  rptTypeCd?: RptType;

  @ApiPropertyOptional({
    description: '수정할 반복 요일 목록 (0:일~6:토)',
    example: [1, 3, 5],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  dayOfWeeks?: number[];

  @ApiPropertyOptional({
    description: '수정할 반복 일자 목록 (1~31)',
    example: [1, 15, 31],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(31, { each: true })
  dayOfMths?: number[];

  @ApiPropertyOptional({
    description: '수정할 알림 시간 (HH:mm)',
    example: '07:30',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  alarmTime?: string;
}
