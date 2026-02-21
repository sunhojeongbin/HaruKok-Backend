import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { VisibilityType } from '../enums/visibility-type.enum';

export class CreateCtgDto {
  @ApiProperty({
    description: '카테고리 이름',
    example: '운동',
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  ctgName: string;

  @ApiPropertyOptional({
    description: '공개 설정',
    enum: VisibilityType,
    example: VisibilityType.FRIENDS,
    default: VisibilityType.FRIENDS,
  })
  @IsOptional()
  @IsEnum(VisibilityType)
  visibility?: VisibilityType;

  @ApiPropertyOptional({
    description: 'HEX 색상 코드',
    example: '#FF5733',
    default: '#000000',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  colorCode?: string;

  @ApiPropertyOptional({
    description: '정렬 순서',
    example: 0,
    default: 0,
    minimum: -32768,
    maximum: 32767,
  })
  @IsOptional()
  @IsInt()
  @Min(-32768)
  @Max(32767)
  sortOrder?: number;
}
