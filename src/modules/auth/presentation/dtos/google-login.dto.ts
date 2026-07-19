import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** @description 구글 로그인 DTO */
export class GoogleLoginDto {
  @ApiProperty({
    description: '구글에서 발급한 ID 토큰(JWT)',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
