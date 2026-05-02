import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

/** @description 이메일 인증 코드 검증을 위한 DTO */
export class VerifyEmailCodeDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail({}, { message: '올바른 이메일 형식으로 입력해 주세요' })
  email: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(6, 6, { message: '인증 코드는 6자리로 입력해 주세요' })
  code: string;
}
