import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AuthResponse } from '../../../common/response/auth.response';
import { UsrResponse } from '../../../common/response/usr.response';
import { GetUsrDashboardUseCase } from '../application/use-cases/get-usr-dashboard.use-case';

@ApiTags('사용자')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('usrs')
export class UsrController {
  constructor(
    private readonly getUsrDashboardUseCase: GetUsrDashboardUseCase,
  ) {}

  @Get('dashboard')
  @ApiOperation({
    summary: '마이페이지 대시보드 조회',
    description: '로그인한 사용자의 이번 달 투두 현황을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    schema: {
      example: {
        httpCode: 200,
        message: UsrResponse.DASHBOARD_FOUND.message,
        success: true,
        data: {
          monthRange: {
            startDt: '2026. 04. 01',
            endDt: '2026. 04. 30',
          },
          monthTodoSummary: {
            todoCompletionRate: 70,
            completedTodoCnt: 42,
            remainingTodoCnt: 18,
            totalTodoCnt: 60,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '사용자 없음',
    schema: {
      example: {
        httpCode: AuthResponse.USER_NOT_FOUND.httpCode,
        message: AuthResponse.USER_NOT_FOUND.message,
        success: false,
        errorCode: AuthResponse.USER_NOT_FOUND.errorCode,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '대시보드 조회 실패',
    schema: {
      example: {
        httpCode: UsrResponse.DASHBOARD_FETCH_FAILED.httpCode,
        message: UsrResponse.DASHBOARD_FETCH_FAILED.message,
        success: false,
        errorCode: UsrResponse.DASHBOARD_FETCH_FAILED.errorCode,
      },
    },
  })
  async getDashboard(@CurrentUserId() userId: string) {
    const data = await this.getUsrDashboardUseCase.execute(userId);
    return ApiResponseDto.success(
      data,
      UsrResponse.DASHBOARD_FOUND.message,
      UsrResponse.DASHBOARD_FOUND.httpCode,
    );
  }
}
