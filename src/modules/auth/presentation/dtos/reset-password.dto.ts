import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

/** @description 임시 비밀번호 검증 후 새 비밀번호로 변경 DTO */
export class ResetPasswordDto {
  @IsEmail()
  @MaxLength(254)
  @IsNotEmpty()
  email: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @IsNotEmpty()
  temporaryPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(254)
  @IsNotEmpty()
  newPassword: string;
}
