import { ApiProperty } from '@nestjs/swagger';

/** @description 로그인 응답 DTO */
export class LoginResponseDto {
  @ApiProperty({ description: '사용자 ID' })
  id: string;

  @ApiProperty({ description: '사용자 이메일' })
  email: string;

  @ApiProperty({ description: '사용자 이름' })
  name: string;

  @ApiProperty({ description: '액세스 토큰' })
  accessToken: string;
}

/** @description 액세스 토큰 재발급 응답 DTO */
export class RefreshResponseDto {
  @ApiProperty({ description: '새로 발급된 액세스 토큰' })
  accessToken: string;
}

/** @description 로그아웃 응답 DTO */
export class LogoutResponseDto {
  @ApiProperty({ description: '로그아웃 처리 여부', example: true })
  ok: boolean;
}
