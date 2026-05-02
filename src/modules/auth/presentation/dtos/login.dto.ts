import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/** @description 로그인 DTO */
export class LoginDto {
  @ApiProperty({
    description: '이메일',
    example: 'test@gmail.com',
    required: true,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail({}, { message: '올바른 이메일 형식으로 입력해 주세요' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: '비밀번호',
    example: '1234',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
