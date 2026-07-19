import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** @description 카카오 로그인 DTO */
export class KakaoLoginDto {
  @ApiProperty({
    description: '카카오에서 발급한 액세스 토큰',
    example: 'AAAA_bbbb_cccc...',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
