import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** @description 회원가입DTO */
export class SignupDto {
  @IsEmail()
  @MaxLength(254)
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(254)
  @IsNotEmpty()
  password: string;

  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  signupToken: string;
}
