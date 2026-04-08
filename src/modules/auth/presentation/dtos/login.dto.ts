import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/** @description 로그인 DTO */
export class LoginDto {
  @ApiProperty({
    description: '이메일',
    example: 'test@gmail.com',
    required: true,
  })
  @IsEmail()
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
