import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { UuidParamPipe } from '../../common/pipes/uuid-param.pipe';
import { RtnResponse } from '../../common/response/rtn.response';
import { CreateRtnDto } from './dtos/create-rtn.dto';
import { ReorderRtnDto } from './dtos/reorder-rtn.dto';
import { UpdateRtnDto } from './dtos/update-rtn.dto';
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
          rptTypeCd: 'WEEKLY',
          startDt: '2026-04-01',
          endDt: '2026-06-30',
          alarmTime: '18:00',
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

  /** @description 로그인 사용자의 동일 카테고리 내 루틴 순서 변경 API */
  @Patch('order')
  @ApiOperation({
    summary: '루틴 순서 변경',
    description:
      '카테고리별 루틴 목록에서 같은 카테고리 내 루틴 순서만 변경합니다.',
  })
  @ApiBody({
    type: ReorderRtnDto,
    examples: {
      default: {
        value: {
          ctgId: '11111111-1111-1111-1111-111111111111',
          rtnIds: [
            '70ff2f32-2dcd-4a59-8a66-c13e4f500002',
            '70ff2f32-2dcd-4a59-8a66-c13e4f500001',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '루틴 순서 변경 성공',
    schema: {
      example: {
        httpCode: 200,
        message: '루틴 정렬 순서가 변경되었습니다.',
        success: true,
        data: [
          {
            rtnId: '70ff2f32-2dcd-4a59-8a66-c13e4f500002',
            sortOrder: 0,
          },
          {
            rtnId: '70ff2f32-2dcd-4a59-8a66-c13e4f500001',
            sortOrder: 1,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '순서 배열 유효성 오류(중복/누락/타 카테고리 루틴 포함)',
    schema: {
      example: {
        httpCode: 400,
        message: '유효하지 않은 루틴 정렬 순서입니다.',
        success: false,
        errorCode: 'ROUTINE_ORDER_INVALID',
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
  async reorder(
    @Request() req: { user?: { userId?: string } },
    @Body() dto: ReorderRtnDto,
  ) {
    const routines = await this.rtnService.reorder(this.getUserId(req), dto);
    return ApiResponseDto.success(
      routines,
      RtnResponse.ROUTINE_ORDER_UPDATE_SUCCESS.message,
      RtnResponse.ROUTINE_ORDER_UPDATE_SUCCESS.httpCode,
    );
  }

  /** @description 로그인 사용자의 루틴 수정 API */
  @Patch(':rtnId')
  @ApiOperation({
    summary: '루틴 수정',
    description:
      '루틴 정보를 수정하고, 오늘 포함 이후 날짜의 루틴 투두를 새 설정으로 동기화합니다(필요한 항목만 추가/수정/삭제). 과거 날짜의 투두는 변경하지 않습니다.',
  })
  @ApiBody({
    type: UpdateRtnDto,
    examples: {
      weekly: {
        summary: '반복 요일 변경',
        value: {
          rtnContent: '헬스장 가기(상체)',
          rptTypeCd: 'WEEKLY',
          dayOfWeeks: [1, 4, 6],
          alarmTime: '19:00',
        },
      },
      monthly: {
        summary: '반복 주기 변경',
        value: {
          rptTypeCd: 'MONTHLY',
          dayOfMths: [1, 15],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '루틴 수정 성공',
    schema: {
      example: {
        httpCode: 200,
        message: '루틴이 수정되었습니다.',
        success: true,
        data: {
          rtnId: '70ff2f32-2dcd-4a59-8a66-c13e4f500001',
          usrId: '00000000-0000-0000-0000-000000000001',
          ctgId: '11111111-1111-1111-1111-111111111111',
          rtnContent: '헬스장 가기(상체)',
          rptTypeCd: 'WEEKLY',
          startDt: '2026-04-01',
          endDt: '2026-06-30',
          alarmTime: '19:00',
          sortOrder: 0,
          createdAt: '2026-03-31T09:00:00.000Z',
          updatedAt: '2026-04-04T09:00:00.000Z',
          repeats: [
            {
              rtnRptId: 'f8f9f9c2-97a2-4cb3-a2a2-9f4a3c120010',
              rptTypeCd: 'WEEKLY',
              dayOfWeek: 1,
              dayOfMth: null,
            },
            {
              rtnRptId: 'f8f9f9c2-97a2-4cb3-a2a2-9f4a3c120011',
              rptTypeCd: 'WEEKLY',
              dayOfWeek: 4,
              dayOfMth: null,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '수정 항목 누락 또는 반복/날짜 검증 실패',
    schema: {
      example: {
        httpCode: 400,
        message:
          '수정할 항목(ctgId, rtnContent, startDt, endDt, rptTypeCd, dayOfWeeks, dayOfMths, alarmTime) 중 최소 1개는 필요합니다.',
        success: false,
        errorCode: 'ROUTINE_UPDATE_PAYLOAD_EMPTY',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '루틴 또는 카테고리 없음',
    schema: {
      example: {
        httpCode: 404,
        message: '루틴을 찾을 수 없습니다.',
        success: false,
        errorCode: 'ROUTINE_NOT_FOUND',
      },
    },
  })
  async update(
    @Request() req: { user?: { userId?: string } },
    @Param('rtnId', UuidParamPipe) rtnId: string,
    @Body() dto: UpdateRtnDto,
  ) {
    const routine = await this.rtnService.update(this.getUserId(req), rtnId, dto);
    return ApiResponseDto.success(
      routine,
      RtnResponse.ROUTINE_UPDATE_SUCCESS.message,
      RtnResponse.ROUTINE_UPDATE_SUCCESS.httpCode,
    );
  }

  /** @description 로그인 사용자의 루틴 삭제 API */
  @Delete(':rtnId')
  @ApiOperation({
    summary: '루틴 삭제',
    description:
      '루틴을 삭제하고, 오늘 포함 이후 날짜의 루틴 투두를 함께 삭제합니다. 과거 날짜의 투두는 유지됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '루틴 삭제 성공',
    schema: {
      example: {
        httpCode: 200,
        message: '루틴이 삭제되었습니다.',
        success: true,
        data: {
          rtnId: '70ff2f32-2dcd-4a59-8a66-c13e4f500001',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '루틴 없음 또는 타 사용자 루틴 접근',
    schema: {
      example: {
        httpCode: 404,
        message: '루틴을 찾을 수 없습니다.',
        success: false,
        errorCode: 'ROUTINE_NOT_FOUND',
      },
    },
  })
  async delete(
    @Request() req: { user?: { userId?: string } },
    @Param('rtnId', UuidParamPipe) rtnId: string,
  ) {
    const deleted = await this.rtnService.delete(this.getUserId(req), rtnId);
    return ApiResponseDto.success(
      deleted,
      RtnResponse.ROUTINE_DELETE_SUCCESS.message,
      RtnResponse.ROUTINE_DELETE_SUCCESS.httpCode,
    );
  }

  /** @description 로그인 사용자의 활성 루틴 상세 조회 API */
  @Get(':rtnId')
  @ApiOperation({
    summary: '루틴 상세 조회',
    description: '루틴 ID로 로그인 사용자의 활성 루틴 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '루틴 상세 조회 성공',
    schema: {
      example: {
        httpCode: 200,
        message: '루틴 상세 조회에 성공했습니다.',
        success: true,
        data: {
          rtnId: '70ff2f32-2dcd-4a59-8a66-c13e4f500001',
          usrId: '00000000-0000-0000-0000-000000000001',
          ctgId: '11111111-1111-1111-1111-111111111111',
          rtnContent: '아침 스트레칭',
          rptTypeCd: 'WEEKLY',
          startDt: '2026-04-01',
          endDt: '2026-06-30',
          alarmTime: '07:00',
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
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '루틴 없음 또는 타 사용자 루틴 접근',
    schema: {
      example: {
        httpCode: 404,
        message: '루틴을 찾을 수 없습니다.',
        success: false,
        errorCode: 'ROUTINE_NOT_FOUND',
      },
    },
  })
  async getById(
    @Request() req: { user?: { userId?: string } },
    @Param('rtnId', UuidParamPipe) rtnId: string,
  ) {
    const routine = await this.rtnService.getById(this.getUserId(req), rtnId);
    return ApiResponseDto.success(
      routine,
      RtnResponse.ROUTINE_GET_SUCCESS.message,
      RtnResponse.ROUTINE_GET_SUCCESS.httpCode,
    );
  }

  /** @description 로그인 사용자의 활성 루틴 목록 조회 API */
  @Get()
  @ApiOperation({
    summary: '루틴 목록 조회',
    description:
      '로그인 사용자의 삭제되지 않은 루틴 목록을 반복 설정과 함께 조회합니다.',
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
            rtnContent: '아침 스트레칭',
            rptTypeCd: 'WEEKLY',
            startDt: '2026-04-01',
            endDt: '2026-06-30',
            alarmTime: '07:00',
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
