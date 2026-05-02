import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { StripHtml } from '../../../../common/decorators/strip-html.decorator';

/** @description 회원가입DTO */
export class SignupDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail({}, { message: '올바른 이메일 형식으로 입력해 주세요' })
  @MaxLength(254, { message: '이메일은 254자 이하로 입력해 주세요' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상 입력해 주세요' })
  @MaxLength(20, { message: '비밀번호는 20자 이하로 입력해 주세요' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/, {
    message: '비밀번호는 영문, 숫자, 특수문자를 각 1자 이상 포함해야 합니다',
  })
  @IsNotEmpty()
  password: string;

  @StripHtml()
  @IsString()
  @MaxLength(50, { message: '이름은 50자 이하로 입력해 주세요' })
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  signupToken: string;
}
