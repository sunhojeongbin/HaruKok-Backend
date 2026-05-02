import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { VisibilityType } from '../../enums/visibility-type.enum';
import { StripHtml } from '../../../../common/decorators/strip-html.decorator';

/**
 * @description 카테고리 수정 요청 DTO
 */
export class UpdateCtgDto {
  @ApiPropertyOptional({
    description: '카테고리 이름',
    example: '독서',
    maxLength: 10,
  })
  @IsOptional()
  @StripHtml()
  @IsString()
  @Length(1, 10, { message: '카테고리 이름은 1~10자로 입력해 주세요' })
  ctgName?: string;

  @ApiPropertyOptional({
    description: '공개 설정',
    enum: VisibilityType,
    example: VisibilityType.PRIVATE,
  })
  @IsOptional()
  @IsEnum(VisibilityType, { message: '공개 설정 값이 올바르지 않습니다' })
  visibility?: VisibilityType;

  @ApiPropertyOptional({
    description: 'HEX 색상 코드',
    example: '#33AAFF',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: '색상 코드는 #RRGGBB 형식으로 입력해 주세요',
  })
  colorCode?: string;

  @ApiPropertyOptional({
    description: '카테고리 종료 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean({
    message: '카테고리 종료 여부는 true 또는 false로 입력해 주세요',
  })
  isEnded?: boolean;
}
