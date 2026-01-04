import { ApiProperty } from '@nestjs/swagger';

/**
 * @description 로그인 DTO
 * @field email 이메일
 * @field password 비밀번호
 */
export class LoginDto {
  @ApiProperty({
    example: 'test@gmail.com',
    description: '이메일',
    required: true,
  })
  email: string;

  @ApiProperty({
    example: '1234',
    description: '비밀번호',
    required: true,
  })
  password: string;
}
