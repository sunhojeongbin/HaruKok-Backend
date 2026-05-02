import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

/** @description 비밀번호 재설정용 임시 비밀번호 전송 DTO */
export class SendTemporaryPasswordDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail({}, { message: '올바른 이메일 형식으로 입력해 주세요' })
  @MaxLength(254, { message: '이메일은 254자 이하로 입력해 주세요' })
  @IsNotEmpty()
  email: string;
}
