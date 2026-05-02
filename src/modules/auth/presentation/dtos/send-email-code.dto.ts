import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

/** @description 이메일 인증 코드 전송을 위한 DTO */
export class SendEmailCodeDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail({}, { message: '올바른 이메일 형식으로 입력해 주세요' })
  email: string;
}
