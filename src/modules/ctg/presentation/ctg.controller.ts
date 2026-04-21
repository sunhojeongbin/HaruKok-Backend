import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UuidParamPipe } from '../../../common/pipes/uuid-param.pipe';
import { CtgResponse } from '../../../common/response/ctg.response';
import { CreateCtgUseCase } from '../application/use-cases/create-ctg.use-case';
import { DeleteCtgUseCase } from '../application/use-cases/delete-ctg.use-case';
import { GetCtgByIdUseCase } from '../application/use-cases/get-ctg-by-id.use-case';
import { GetCtgListUseCase } from '../application/use-cases/get-ctg-list.use-case';
import { ReorderCtgUseCase } from '../application/use-cases/reorder-ctg.use-case';
import { UpdateCtgUseCase } from '../application/use-cases/update-ctg.use-case';
import { CreateCtgDto } from './dtos/create-ctg.dto';
import { ReorderCtgDto } from './dtos/reorder-ctg.dto';
import { UpdateCtgDto } from './dtos/update-ctg.dto';

/** @description 카테고리 관련 API를 제공하는 컨트롤러 */
@ApiTags('카테고리')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ctgs')
export class CtgController {
  constructor(
    private readonly createCtgUseCase: CreateCtgUseCase,
    private readonly getCtgListUseCase: GetCtgListUseCase,
    private readonly getCtgByIdUseCase: GetCtgByIdUseCase,
    private readonly reorderCtgUseCase: ReorderCtgUseCase,
    private readonly updateCtgUseCase: UpdateCtgUseCase,
    private readonly deleteCtgUseCase: DeleteCtgUseCase,
  ) {}

  /** @description 카테고리 등록 API */
  @Post()
  @ApiOperation({
    summary: '카테고리 등록',
    description:
      '새 카테고리를 등록합니다. 한 사용자당 최대 10개까지 생성할 수 있습니다.',
  })
  @ApiBody({
    type: CreateCtgDto,
    examples: {
      default: {
        value: {
          ctgName: '운동',
          visibility: 'FRIENDS',
          colorCode: '#FF5733',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '카테고리 생성 성공',
    schema: {
      example: {
        httpCode: 201,
        message: '카테고리가 생성되었습니다.',
        success: true,
        data: {
          ctgId: '8128ec5d-ed76-4510-89f3-d362ce6f572c',
          usrId: '00000000-0000-0000-0000-000000000001',
          ctgName: '운동',
          visibility: 'FRIENDS',
          colorCode: '#FF5733',
          sortOrder: 0,
          isEnded: false,
          endedAt: null,
          createdAt: '2026-02-21T12:00:00.000Z',
          updatedAt: '2026-02-21T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '카테고리 개수 제한 또는 이름 형식 오류',
    schema: {
      example: {
        httpCode: 400,
        message: '카테고리는 사용자당 최대 10개까지 생성할 수 있습니다.',
        success: false,
        errorCode: 'CATEGORY_LIMIT_EXCEEDED',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: '카테고리 이름 중복',
    schema: {
      example: {
        httpCode: 409,
        message: '이미 존재하는 카테고리 이름입니다.',
        success: false,
        errorCode: 'CATEGORY_NAME_DUPLICATED',
      },
    },
  })
  async create(@CurrentUserId() userId: string, @Body() dto: CreateCtgDto) {
    const ctg = await this.createCtgUseCase.execute(userId, dto);
    return ApiResponseDto.success(
      ctg,
      CtgResponse.CATEGORY_CREATE_SUCCESS.message,
      CtgResponse.CATEGORY_CREATE_SUCCESS.httpCode,
    );
  }

  /** @description 로그인 사용자의 카테고리 목록을 조회하는 API */
  @Get()
  @ApiOperation({
    summary: '카테고리 목록 조회',
    description:
      '삭제되지 않은 카테고리 목록을 `sortOrder` 오름차순으로 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '카테고리 목록 조회 성공',
    schema: {
      example: {
        httpCode: 200,
        message: '카테고리 목록 조회에 성공했습니다.',
        success: true,
        data: [
          {
            ctgId: '11111111-1111-1111-1111-111111111111',
            usrId: '00000000-0000-0000-0000-000000000001',
            ctgName: '운동',
            visibility: 'FRIENDS',
            colorCode: '#FF5733',
            sortOrder: 0,
            isEnded: false,
            endedAt: null,
            createdAt: '2026-02-21T12:00:00.000Z',
            updatedAt: '2026-02-21T12:00:00.000Z',
          },
        ],
      },
    },
  })
  async getList(@CurrentUserId() userId: string) {
    const ctgs = await this.getCtgListUseCase.execute(userId);
    return ApiResponseDto.success(
      ctgs,
      CtgResponse.CATEGORY_LIST_SUCCESS.message,
      CtgResponse.CATEGORY_LIST_SUCCESS.httpCode,
    );
  }

  /** @description 카테고리 상세 조회 API */
  @Get(':ctgId')
  @ApiOperation({
    summary: '카테고리 상세 조회',
    description: '카테고리 ID로 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '카테고리 조회 성공',
    schema: {
      example: {
        httpCode: 200,
        message: '카테고리 조회에 성공했습니다.',
        success: true,
        data: {
          ctgId: '11111111-1111-1111-1111-111111111111',
          usrId: '00000000-0000-0000-0000-000000000001',
          ctgName: '운동',
          visibility: 'FRIENDS',
          colorCode: '#FF5733',
          sortOrder: 0,
          isEnded: false,
          endedAt: null,
          createdAt: '2026-02-21T12:00:00.000Z',
          updatedAt: '2026-02-21T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '카테고리 없음',
    schema: {
      example: {
        httpCode: 404,
        message: '카테고리를 찾을 수 없습니다.',
        success: false,
        errorCode: 'CATEGORY_NOT_FOUND',
      },
    },
  })
  async getById(
    @CurrentUserId() userId: string,
    @Param('ctgId', UuidParamPipe) ctgId: string,
  ) {
    const ctg = await this.getCtgByIdUseCase.execute(userId, ctgId);
    return ApiResponseDto.success(
      ctg,
      CtgResponse.CATEGORY_GET_SUCCESS.message,
      CtgResponse.CATEGORY_GET_SUCCESS.httpCode,
    );
  }

  /** @description 카테고리 순서 변경 API */
  @Patch('orders')
  @ApiOperation({
    summary: '카테고리 순서 변경',
    description:
      // '화면에서 드래그한 최종 순서를 `ctgIds` 배열로 전달하면 전체 `sortOrder`가 0부터 다시 저장됩니다.',
      '사용자가 변경한 카테고리 순서를 `ctgIds` 배열로 전달하면 해당 순서대로 `sortOrder`가 0부터 다시 저장됩니다.',
  })
  @ApiBody({
    type: ReorderCtgDto,
    examples: {
      default: {
        value: {
          ctgIds: [
            '11111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '카테고리 순서 변경 성공',
    schema: {
      example: {
        httpCode: 200,
        message: '카테고리 정렬 순서가 변경되었습니다.',
        success: true,
        data: [
          {
            ctgId: '22222222-2222-2222-2222-222222222222',
            sortOrder: 0,
          },
          {
            ctgId: '11111111-1111-1111-1111-111111111111',
            sortOrder: 1,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '순서 배열 유효성 오류(중복/누락/타인 카테고리 포함)',
    schema: {
      example: {
        httpCode: 400,
        message: '유효하지 않은 카테고리 정렬 순서입니다.',
        success: false,
        errorCode: 'CATEGORY_ORDER_INVALID',
      },
    },
  })
  async reorder(@CurrentUserId() userId: string, @Body() dto: ReorderCtgDto) {
    const ctgs = await this.reorderCtgUseCase.execute(userId, dto.ctgIds);
    return ApiResponseDto.success(
      ctgs,
      CtgResponse.CATEGORY_ORDER_UPDATE_SUCCESS.message,
      CtgResponse.CATEGORY_ORDER_UPDATE_SUCCESS.httpCode,
    );
  }

  /** @description 카테고리 이름/공개설정/색상/종료여부를 수정 API */
  @Patch(':ctgId')
  @ApiOperation({
    summary: '카테고리 수정',
    description:
      '카테고리 이름, 공개 설정, 색상, 종료여부를 수정합니다. 정렬 순서는 이 API에서 변경하지 않습니다.',
  })
  @ApiBody({
    type: UpdateCtgDto,
    examples: {
      default: {
        value: {
          ctgName: '독서',
          visibility: 'PRIVATE',
          colorCode: '#33AAFF',
          isEnded: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '카테고리 수정 성공',
    schema: {
      example: {
        httpCode: 200,
        message: '카테고리가 수정되었습니다.',
        success: true,
        data: {
          ctgId: '11111111-1111-1111-1111-111111111111',
          ctgName: '독서',
          visibility: 'PRIVATE',
          colorCode: '#33AAFF',
          sortOrder: 0,
          isEnded: false,
          endedAt: null,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '카테고리 없음',
    schema: {
      example: {
        httpCode: 404,
        message: '카테고리를 찾을 수 없습니다.',
        success: false,
        errorCode: 'CATEGORY_NOT_FOUND',
      },
    },
  })
  async update(
    @CurrentUserId() userId: string,
    @Param('ctgId', UuidParamPipe) ctgId: string,
    @Body() dto: UpdateCtgDto,
  ) {
    const ctg = await this.updateCtgUseCase.execute(userId, ctgId, dto);
    return ApiResponseDto.success(
      ctg,
      CtgResponse.CATEGORY_UPDATE_SUCCESS.message,
      CtgResponse.CATEGORY_UPDATE_SUCCESS.httpCode,
    );
  }

  /** @description 카테고리를 소프트 삭제 API */
  @Delete(':ctgId')
  @HttpCode(200)
  @ApiOperation({
    summary: '카테고리 삭제',
    description:
      '카테고리를 삭제하고, 해당 카테고리와 연관된 루틴/투두/반복설정을 함께 삭제한 뒤 남은 카테고리의 `sortOrder`를 0부터 다시 정렬합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '카테고리 삭제 성공',
    schema: {
      example: {
        httpCode: 200,
        message: '카테고리가 삭제되었습니다.',
        success: true,
        data: {
          ctgId: '11111111-1111-1111-1111-111111111111',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '카테고리 없음',
    schema: {
      example: {
        httpCode: 404,
        message: '카테고리를 찾을 수 없습니다.',
        success: false,
        errorCode: 'CATEGORY_NOT_FOUND',
      },
    },
  })
  async delete(
    @CurrentUserId() userId: string,
    @Param('ctgId', UuidParamPipe) ctgId: string,
  ) {
    const deleted = await this.deleteCtgUseCase.execute(userId, ctgId);
    return ApiResponseDto.success(
      deleted,
      CtgResponse.CATEGORY_DELETE_SUCCESS.message,
      CtgResponse.CATEGORY_DELETE_SUCCESS.httpCode,
    );
  }
}
