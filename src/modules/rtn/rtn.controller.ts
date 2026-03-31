import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RtnResponse } from '../../common/response/rtn.response';
import { CreateRtnDto } from './dtos/create-rtn.dto';
import { RtnService } from './rtn.service';

/** @description 루틴 관련 API를 제공하는 컨트롤러 */
@ApiTags('루틴')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rtn')
export class RtnController {
  constructor(private readonly rtnService: RtnService) {}

  /**
   * @description 인증 컨텍스트에서 사용자 ID를 추출한다.
   */
  private getUserId(req: { user?: { userId?: string } }): string {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('인증에 실패했습니다.');
    }
    return userId;
  }

  /** @description 로그인 사용자의 루틴 생성 API */
  @Post()
  @ApiOperation({
    summary: '루틴 생성',
    description:
      '루틴을 생성하고 반복 조건에 맞는 기간 내 투두를 함께 생성합니다.',
  })
  @ApiBody({
    type: CreateRtnDto,
    examples: {
      daily: {
        summary: '매일 반복',
        value: {
          ctgId: '11111111-1111-1111-1111-111111111111',
          rtnContent: '아침 스트레칭 10분',
          startDt: '2026-04-01',
          endDt: '2026-04-07',
          rptTypeCd: 'DAILY',
          alarmTime: '07:30',
        },
      },
      weekly: {
        summary: '매주 반복',
        value: {
          ctgId: '11111111-1111-1111-1111-111111111111',
          rtnContent: '헬스장 가기',
          startDt: '2026-04-01',
          endDt: '2026-06-30',
          rptTypeCd: 'WEEKLY',
          dayOfWeeks: [1, 3, 5],
          alarmTime: '18:00',
        },
      },
      monthly: {
        summary: '매월 반복',
        value: {
          ctgId: '11111111-1111-1111-1111-111111111111',
          rtnContent: '월간 가계부 정리',
          startDt: '2026-04-01',
          endDt: '2026-12-31',
          rptTypeCd: 'MONTHLY',
          dayOfMths: [1, 15, 31],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '루틴 생성 성공',
    schema: {
      example: {
        httpCode: 201,
        message: '루틴이 생성되었습니다.',
        success: true,
        data: {
          rtnId: '70ff2f32-2dcd-4a59-8a66-c13e4f500001',
          usrId: '00000000-0000-0000-0000-000000000001',
          ctgId: '11111111-1111-1111-1111-111111111111',
          ctgColorCode: '#FF5733',
          rtnContent: '헬스장 가기',
          rtnDesc: null,
          rptTypeCd: 'WEEKLY',
          startDt: '2026-04-01',
          endDt: '2026-06-30',
          alarmTime: '18:00:00',
          sortOrder: 0,
          createdAt: '2026-03-31T09:00:00.000Z',
          updatedAt: '2026-03-31T09:00:00.000Z',
          repeats: [
            {
              rtnRptId: 'f8f9f9c2-97a2-4cb3-a2a2-9f4a3c120001',
              rptTypeCd: 'WEEKLY',
              dayOfWeek: 1,
              dayOfMth: null,
            },
            {
              rtnRptId: 'f8f9f9c2-97a2-4cb3-a2a2-9f4a3c120002',
              rptTypeCd: 'WEEKLY',
              dayOfWeek: 3,
              dayOfMth: null,
            },
          ],
          createdTodoCount: 26,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '입력값/반복조건 검증 실패',
    schema: {
      example: {
        httpCode: 400,
        message: '매주 반복은 반복 요일을 1개 이상 선택해야 합니다.',
        success: false,
        errorCode: 'ROUTINE_REPEAT_DAYS_REQUIRED',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '카테고리 없음',
    schema: {
      example: {
        httpCode: 404,
        message: '사용자의 카테고리를 찾을 수 없습니다.',
        success: false,
        errorCode: 'ROUTINE_CATEGORY_NOT_FOUND',
      },
    },
  })
  async create(
    @Request() req: { user?: { userId?: string } },
    @Body() dto: CreateRtnDto,
  ) {
    const routine = await this.rtnService.create(this.getUserId(req), dto);
    return ApiResponseDto.success(
      routine,
      RtnResponse.ROUTINE_CREATE_SUCCESS.message,
      RtnResponse.ROUTINE_CREATE_SUCCESS.httpCode,
    );
  }

  /** @description 로그인 사용자의 활성 루틴 목록 조회 API */
  @Get()
  @ApiOperation({
    summary: '루틴 목록 조회',
    description:
      '로그인 사용자의 삭제되지 않은 루틴 목록을 반복 설정 및 카테고리 색상과 함께 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '루틴 목록 조회 성공',
    schema: {
      example: {
        httpCode: 200,
        message: '루틴 목록 조회에 성공했습니다.',
        success: true,
        data: [
          {
            rtnId: '70ff2f32-2dcd-4a59-8a66-c13e4f500001',
            usrId: '00000000-0000-0000-0000-000000000001',
            ctgId: '11111111-1111-1111-1111-111111111111',
            ctgColorCode: '#FF5733',
            rtnContent: '아침 스트레칭',
            rtnDesc: '기상 후 10분',
            rptTypeCd: 'WEEKLY',
            startDt: '2026-04-01',
            endDt: '2026-06-30',
            alarmTime: '07:00:00',
            sortOrder: 0,
            createdAt: '2026-03-31T09:00:00.000Z',
            updatedAt: '2026-03-31T09:00:00.000Z',
            repeats: [
              {
                rtnRptId: 'f8f9f9c2-97a2-4cb3-a2a2-9f4a3c120001',
                rptTypeCd: 'WEEKLY',
                dayOfWeek: 1,
                dayOfMth: null,
              },
              {
                rtnRptId: 'f8f9f9c2-97a2-4cb3-a2a2-9f4a3c120002',
                rptTypeCd: 'WEEKLY',
                dayOfWeek: 3,
                dayOfMth: null,
              },
            ],
          },
        ],
      },
    },
  })
  async getList(@Request() req: { user?: { userId?: string } }) {
    const routines = await this.rtnService.getList(this.getUserId(req));
    return ApiResponseDto.success(
      routines,
      RtnResponse.ROUTINE_LIST_SUCCESS.message,
      RtnResponse.ROUTINE_LIST_SUCCESS.httpCode,
    );
  }
}
