import { IsEmail } from 'class-validator';

/** @description 이메일 인증 코드 전송을 위한 DTO */
export class SendEmailCodeDto {
  @IsEmail()
  email: string;
}
