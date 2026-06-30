import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * @description FCM 디바이스 토큰 삭제 요청 DTO
 * fcmToken은 형식이 강제되는 값이므로 StripHtml 제외
 */
export class RemoveNtfTokenDto {
  @ApiProperty({
    description: '삭제할 FCM 디바이스 등록 토큰',
    example: 'dGhpcy1pcy1hLXNhbXBsZS1mY20tdG9rZW4...',
  })
  @IsString()
  @IsNotEmpty({ message: 'FCM 토큰을 입력해 주세요' })
  @MaxLength(512, { message: 'FCM 토큰이 너무 깁니다' })
  fcmToken: string;
}
