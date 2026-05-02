import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { VisibilityType } from '../../enums/visibility-type.enum';
import { StripHtml } from '../../../../common/decorators/strip-html.decorator';

/**
 * @description 카테고리 생성 요청 DTO
 */
export class CreateCtgDto {
  @ApiProperty({
    description: '카테고리 이름',
    example: '운동',
    maxLength: 10,
  })
  @StripHtml()
  @IsString()
  @IsNotEmpty()
  @Length(1, 10, {
    message: '카테고리 이름은 공백 없이 1~10자로 입력해주세요.',
  })
  ctgName: string;

  @ApiPropertyOptional({
    description: '공개 설정',
    enum: VisibilityType,
    example: VisibilityType.FRIENDS,
    default: VisibilityType.FRIENDS,
  })
  @IsOptional()
  @IsEnum(VisibilityType, { message: '공개 설정 값이 올바르지 않습니다' })
  visibility?: VisibilityType;

  @ApiPropertyOptional({
    description: 'HEX 색상 코드',
    example: '#FF5733',
    default: '#000000',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: '색상 코드는 #RRGGBB 형식으로 입력해 주세요',
  })
  colorCode?: string;
}
