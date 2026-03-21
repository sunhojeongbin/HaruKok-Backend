import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TodoResponse } from '../../common/response/todo.response';
import { CreateTodoDto } from './dtos/create-todo.dto';
import { ListTodosQueryDto } from './dtos/list-todos-query.dto';
import { TodoService } from './todo.service';

/** @description 투두 관련 API를 제공하는 컨트롤러 */
@ApiTags('투두')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

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

  /** @description 로그인 사용자의 투두 생성 API */
  @Post()
  @ApiOperation({
    summary: '투두 생성',
    description:
      '로그인 사용자의 투두를 생성합니다. 카테고리와 할 일은 필수, 메모는 선택입니다.',
  })
  @ApiBody({
    type: CreateTodoDto,
    examples: {
      default: {
        value: {
          ctgId: '11111111-1111-1111-1111-111111111111',
          content: '러닝 5km',
          memo: '아침 7시 한강',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '투두 생성 성공',
    schema: {
      example: {
        httpCode: 201,
        message: '투두가 생성되었습니다.',
        success: true,
        data: {
          todoId: '4cf1c1f2-a5cd-49e9-89a8-6ec87f200001',
          usrId: '00000000-0000-0000-0000-000000000001',
          ctgId: '11111111-1111-1111-1111-111111111111',
          content: '러닝 5km',
          memo: '아침 7시 한강',
          todoDate: '2026-03-21',
          isCompleted: false,
          completedAt: null,
          sortOrder: 0,
          createdAt: '2026-03-21T12:00:00.000Z',
          updatedAt: '2026-03-21T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '사용자 소유 카테고리 아님',
    schema: {
      example: {
        httpCode: 404,
        message: '사용자의 카테고리를 찾을 수 없습니다.',
        success: false,
        errorCode: 'TODO_CATEGORY_NOT_FOUND',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '할 일/메모 길이 검증 실패',
    schema: {
      example: {
        httpCode: 400,
        message: '할 일 내용은 공백이 아닌 1~255자여야 합니다.',
        success: false,
        errorCode: 'TODO_CONTENT_INVALID',
      },
    },
  })
  async create(
    @Request() req: { user?: { userId?: string } },
    @Body() dto: CreateTodoDto,
  ) {
    const todo = await this.todoService.create(this.getUserId(req), dto);
    return ApiResponseDto.success(
      todo,
      TodoResponse.TODO_CREATE_SUCCESS.message,
      TodoResponse.TODO_CREATE_SUCCESS.httpCode,
    );
  }

  /** @description 로그인 사용자의 월별 투두 목록 조회 API */
  @Get()
  @ApiOperation({
    summary: '투두 목록 조회',
    description:
      '로그인 사용자의 월별 투두 목록을 조회합니다. `yearMonth` 미입력 시 현재 월을 조회합니다.',
  })
  @ApiQuery({
    name: 'yearMonth',
    required: false,
    description: '조회할 년-월(YYYY-MM)',
    example: '2026-03',
  })
  @ApiResponse({
    status: 200,
    description: '투두 목록 조회 성공',
    schema: {
      example: {
        httpCode: 200,
        message: '투두 목록 조회에 성공했습니다.',
        success: true,
        data: [
          {
            todoId: '4cf1c1f2-a5cd-49e9-89a8-6ec87f200001',
            usrId: '00000000-0000-0000-0000-000000000001',
            ctgId: '11111111-1111-1111-1111-111111111111',
            content: '러닝 5km',
            memo: '아침 7시 한강',
            todoDate: '2026-03-21',
            isCompleted: false,
            completedAt: null,
            sortOrder: 0,
            createdAt: '2026-03-20T12:00:00.000Z',
            updatedAt: '2026-03-20T12:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '조회 월 형식 오류',
    schema: {
      example: {
        httpCode: 400,
        message: '조회 월 형식이 올바르지 않습니다. (YYYY-MM)',
        success: false,
        errorCode: 'TODO_QUERY_MONTH_INVALID',
      },
    },
  })
  async getList(
    @Request() req: { user?: { userId?: string } },
    @Query() query: ListTodosQueryDto,
  ) {
    const todos = await this.todoService.getList(
      this.getUserId(req),
      query.yearMonth,
    );
    return ApiResponseDto.success(
      todos,
      TodoResponse.TODO_LIST_SUCCESS.message,
      TodoResponse.TODO_LIST_SUCCESS.httpCode,
    );
  }
}
