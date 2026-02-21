import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { VisibilityType } from '../enums/visibility-type.enum';

export class UpdateCtgDto {
  @ApiPropertyOptional({
    description: '카테고리 이름',
    example: '독서',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  ctgName?: string;

  @ApiPropertyOptional({
    description: '공개 설정',
    enum: VisibilityType,
    example: VisibilityType.PRIVATE,
  })
  @IsOptional()
  @IsEnum(VisibilityType)
  visibility?: VisibilityType;

  @ApiPropertyOptional({
    description: 'HEX 색상 코드',
    example: '#33AAFF',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  colorCode?: string;

  @ApiPropertyOptional({
    description: '정렬 순서',
    example: 2,
    minimum: -32768,
    maximum: 32767,
  })
  @IsOptional()
  @IsInt()
  @Min(-32768)
  @Max(32767)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: '카테고리 종료 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isEnded?: boolean;
}
