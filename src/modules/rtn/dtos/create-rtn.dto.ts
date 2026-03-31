import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RptType } from '../enums/rpt-type.enum';

/**
 * @description 루틴 생성 요청 DTO
 */
export class CreateRtnDto {
  @ApiProperty({
    description: '카테고리 ID',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsUUID('4')
  ctgId: string;

  @ApiProperty({
    description: '루틴 내용',
    example: '아침 스트레칭 10분',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  rtnContent: string;

  @ApiProperty({
    description: '시작 날짜 (YYYY-MM-DD)',
    example: '2026-04-01',
  })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
  startDt: string;

  @ApiProperty({
    description: '종료 날짜 (YYYY-MM-DD)',
    example: '2026-06-30',
  })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
  endDt: string;

  @ApiProperty({
    description: '반복 주기',
    enum: RptType,
    example: RptType.WEEKLY,
  })
  @IsEnum(RptType)
  rptTypeCd: RptType;

  @ApiPropertyOptional({
    description:
      '반복 요일 목록 (0:일~6:토, WEEKLY일 때 필수, 하나 이상 선택)',
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
    description:
      '반복 일자 목록 (1~31, MONTHLY일 때 필수, 여러 일자 선택 가능)',
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
    description: '알림 시간 (HH:mm 또는 HH:mm:ss)',
    example: '07:30',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
  alarmTime?: string;
}
