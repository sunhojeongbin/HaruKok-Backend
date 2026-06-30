import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * @description FCM 디바이스 토큰 등록 요청 DTO
 * fcmToken/platformCd는 형식이 강제되는 값이므로 StripHtml 제외
 */
export class RegisterNtfTokenDto {
  @ApiProperty({
    description: 'FCM 디바이스 등록 토큰',
    example: 'dGhpcy1pcy1hLXNhbXBsZS1mY20tdG9rZW4...',
  })
  @IsString()
  @IsNotEmpty({ message: 'FCM 토큰을 입력해 주세요' })
  @MaxLength(512, { message: 'FCM 토큰이 너무 깁니다' })
  fcmToken: string;

  @ApiProperty({
    description: '플랫폼 코드 (AOS / IOS / WEB)',
    example: 'AOS',
    enum: ['AOS', 'IOS', 'WEB'],
  })
  @IsIn(['AOS', 'IOS', 'WEB'], {
    message: '플랫폼은 AOS, IOS, WEB 중 하나여야 합니다',
  })
  platformCd: string;
}
