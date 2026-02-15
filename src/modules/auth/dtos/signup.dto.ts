import { IsEmail, IsString, MinLength } from 'class-validator';

/** @description 회원가입DTO */
export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  name: string;

  @IsString()
  signupToken: string;
}
