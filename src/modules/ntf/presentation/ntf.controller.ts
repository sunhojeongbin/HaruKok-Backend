import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { NtfResponse } from '../../../common/response/ntf.response';
import { RegisterNtfTokenUseCase } from '../application/use-cases/register-ntf-token.use-case';
import { RemoveNtfTokenUseCase } from '../application/use-cases/remove-ntf-token.use-case';
import { SendSamplePushUseCase } from '../application/use-cases/send-sample-push.use-case';
import { RegisterNtfTokenDto } from './dtos/register-ntf-token.dto';
import { RemoveNtfTokenDto } from './dtos/remove-ntf-token.dto';
import { SendSamplePushDto } from './dtos/send-sample-push.dto';

@ApiTags('알림')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ntf-tokens')
export class NtfController {
  constructor(
    private readonly registerNtfTokenUseCase: RegisterNtfTokenUseCase,
    private readonly removeNtfTokenUseCase: RemoveNtfTokenUseCase,
    private readonly sendSamplePushUseCase: SendSamplePushUseCase,
  ) {}

  @Post()
  @HttpCode(NtfResponse.NTF_TOKEN_REGISTER_SUCCESS.httpCode)
  @ApiOperation({
    summary: 'FCM 디바이스 토큰 등록',
    description:
      '로그인한 사용자의 FCM 토큰을 저장/갱신합니다. 동일 토큰은 최신 사용자로 재바인딩됩니다.',
  })
  @ApiResponse({ status: 201, description: '등록 성공' })
  async register(
    @CurrentUserId() userId: string,
    @Body() dto: RegisterNtfTokenDto,
  ) {
    await this.registerNtfTokenUseCase.execute(userId, {
      fcmToken: dto.fcmToken,
      platformCd: dto.platformCd,
    });
    return ApiResponseDto.success(
      null,
      NtfResponse.NTF_TOKEN_REGISTER_SUCCESS.message,
      NtfResponse.NTF_TOKEN_REGISTER_SUCCESS.httpCode,
    );
  }

  @Delete()
  @ApiOperation({
    summary: 'FCM 디바이스 토큰 삭제',
    description: '로그아웃/기기 해제 시 해당 FCM 토큰을 삭제합니다.',
  })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  async remove(
    @CurrentUserId() userId: string,
    @Body() dto: RemoveNtfTokenDto,
  ) {
    await this.removeNtfTokenUseCase.execute(userId, {
      fcmToken: dto.fcmToken,
    });
    return ApiResponseDto.success(
      null,
      NtfResponse.NTF_TOKEN_REMOVE_SUCCESS.message,
      NtfResponse.NTF_TOKEN_REMOVE_SUCCESS.httpCode,
    );
  }

  @Post('test-push')
  @HttpCode(NtfResponse.PUSH_SEND_SUCCESS.httpCode)
  @ApiOperation({
    summary: 'FCM 샘플 푸시 발송 (테스트용)',
    description:
      '로그인한 사용자가 등록한 모든 활성 FCM 토큰으로 입력한 제목/본문의 푸시를 발송합니다. FCM 연동 확인용 샘플 API입니다.',
  })
  @ApiResponse({ status: 200, description: '발송 성공' })
  @ApiResponse({ status: 404, description: '등록된 디바이스 토큰 없음' })
  @ApiResponse({ status: 500, description: '푸시 발송 실패' })
  async sendSamplePush(
    @CurrentUserId() userId: string,
    @Body() dto: SendSamplePushDto,
  ) {
    const result = await this.sendSamplePushUseCase.execute(userId, {
      title: dto.title,
      body: dto.body,
    });
    return ApiResponseDto.success(
      result,
      NtfResponse.PUSH_SEND_SUCCESS.message,
      NtfResponse.PUSH_SEND_SUCCESS.httpCode,
    );
  }
}
