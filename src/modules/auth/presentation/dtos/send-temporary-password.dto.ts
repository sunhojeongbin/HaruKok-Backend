import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

/** @description 비밀번호 재설정용 임시 비밀번호 전송 DTO */
export class SendTemporaryPasswordDto {
  @IsEmail()
  @MaxLength(254)
  @IsNotEmpty()
  email: string;
}
