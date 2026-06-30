import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { StripHtml } from '../../../../common/decorators/strip-html.decorator';

/**
 * @description 샘플 FCM 푸시 발송 요청 DTO
 * title/body는 자유 텍스트이므로 StripHtml로 XSS 방어
 */
export class SendSamplePushDto {
  @ApiProperty({
    description: '푸시 알림 제목',
    example: '하루콕 테스트 알림',
  })
  @StripHtml()
  @IsString()
  @IsNotEmpty({ message: '알림 제목을 입력해 주세요' })
  @MaxLength(100, { message: '알림 제목이 너무 깁니다' })
  title: string;

  @ApiProperty({
    description: '푸시 알림 본문',
    example: '푸시 알림이 정상적으로 도착했어요!',
  })
  @StripHtml()
  @IsString()
  @IsNotEmpty({ message: '알림 본문을 입력해 주세요' })
  @MaxLength(255, { message: '알림 본문이 너무 깁니다' })
  body: string;
}
