import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** @description 임시 비밀번호 검증 후 새 비밀번호로 변경 DTO */
export class ResetPasswordDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail({}, { message: '올바른 이메일 형식으로 입력해 주세요' })
  @MaxLength(254, { message: '이메일은 254자 이하로 입력해 주세요' })
  @IsNotEmpty()
  email: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(8, { message: '임시 비밀번호는 8~64자로 입력해 주세요' })
  @MaxLength(64, { message: '임시 비밀번호는 8~64자로 입력해 주세요' })
  @IsNotEmpty()
  temporaryPassword: string;

  @IsString()
  @MinLength(8, { message: '새 비밀번호는 8자 이상 입력해 주세요' })
  @MaxLength(20, { message: '새 비밀번호는 20자 이하로 입력해 주세요' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/, {
    message: '비밀번호는 영문, 숫자, 특수문자를 각 1자 이상 포함해야 합니다',
  })
  @IsNotEmpty()
  newPassword: string;
}
