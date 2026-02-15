import { IsEmail, IsString, Length } from 'class-validator';

/** @description 이메일 인증 코드 검증을 위한 DTO */
export class VerifyEmailCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
