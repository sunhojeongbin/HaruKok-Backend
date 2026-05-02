import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RptType } from '../../enums/rpt-type.enum';
import { StripHtml } from '../../../../common/decorators/strip-html.decorator';

/**
 * @description 루틴 생성 요청 DTO
 */
export class CreateRtnDto {
  @ApiProperty({
    description: '카테고리 ID',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsUUID('4', { message: '올바른 카테고리 ID 형식이 아닙니다' })
  ctgId: string;

  @ApiProperty({
    description: '루틴 내용',
    example: '아침 스트레칭 10분',
    maxLength: 100,
  })
  @StripHtml()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: '루틴 내용은 100자 이하로 입력해 주세요' })
  rtnContent: string;

  @ApiProperty({
    description: '시작 날짜 (YYYY-MM-DD)',
    example: '2026-04-01',
  })
  @IsDateString({}, { message: '시작 날짜는 YYYY-MM-DD 형식으로 입력해 주세요' })
  startDt: string;

  @ApiProperty({
    description: '종료 날짜 (YYYY-MM-DD)',
    example: '2026-06-30',
  })
  @IsDateString({}, { message: '종료 날짜는 YYYY-MM-DD 형식으로 입력해 주세요' })
  endDt: string;

  @ApiProperty({
    description: '반복 주기',
    enum: RptType,
    example: RptType.WEEKLY,
  })
  @IsEnum(RptType, { message: '반복 주기 값이 올바르지 않습니다' })
  rptTypeCd: RptType;

  @ApiPropertyOptional({
    description: '반복 요일 목록 (0:일~6:토, WEEKLY일 때 필수, 하나 이상 선택)',
    example: [1, 3, 5],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: '반복 요일은 1개 이상 선택해 주세요' })
  @ArrayUnique({ message: '반복 요일이 중복되었습니다' })
  @IsInt({ each: true, message: '반복 요일은 정수로 입력해 주세요' })
  @Min(0, { each: true, message: '반복 요일은 0(일)~6(토) 범위로 입력해 주세요' })
  @Max(6, { each: true, message: '반복 요일은 0(일)~6(토) 범위로 입력해 주세요' })
  dayOfWeeks?: number[];

  @ApiPropertyOptional({
    description:
      '반복 일자 목록 (1~31, MONTHLY일 때 필수, 여러 일자 선택 가능)',
    example: [1, 15, 31],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: '반복 일자는 1개 이상 선택해 주세요' })
  @ArrayUnique({ message: '반복 일자가 중복되었습니다' })
  @IsInt({ each: true, message: '반복 일자는 정수로 입력해 주세요' })
  @Min(1, { each: true, message: '반복 일자는 1~31 범위로 입력해 주세요' })
  @Max(31, { each: true, message: '반복 일자는 1~31 범위로 입력해 주세요' })
  dayOfMths?: number[];

  @ApiPropertyOptional({
    description: '알림 시간 (HH:mm)',
    example: '07:30',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '알림 시간은 HH:mm 형식으로 입력해 주세요' })
  alarmTime?: string;
}
