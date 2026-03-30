import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { RepeatNextTodoDto } from './dtos/repeat-next-todo.dto';
import { SearchTodosQueryDto } from './dtos/search-todos-query.dto';
import { UpdateTodoDto } from './dtos/update-todo.dto';
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
      '로그인 사용자의 투두를 생성합니다. 카테고리와 할 일은 필수, 메모와 날짜(todoDate)는 선택입니다. 날짜 미입력 시 오늘 날짜로 생성됩니다.',
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
      customDate: {
        value: {
          ctgId: '11111111-1111-1111-1111-111111111111',
          content: '도서관 2시간',
          memo: '자료 대출 포함',
          todoDate: '2026-04-05',
        },
        summary: '원하는 날짜로 투두 생성',
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
    description: '할 일/메모 길이 또는 날짜 형식 검증 실패',
    schema: {
      example: {
        httpCode: 400,
        message: '투두 날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)',
        success: false,
        errorCode: 'TODO_DATE_INVALID',
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

  /** @description 로그인 사용자의 투두 수정 API */
  @Patch(':todoId')
  @ApiOperation({
    summary: '투두 수정',
    description:
      '카테고리(ctgId), 내용(content), 메모(memo)만 수정할 수 있습니다.',
  })
  @ApiBody({
    type: UpdateTodoDto,
    examples: {
      default: {
        value: {
          ctgId: '11111111-1111-1111-1111-111111111111',
          content: '러닝 7km',
          memo: '저녁 8시 인터벌 포함',
        },
      },
      memoOnly: {
        value: {
          memo: '   ',
        },
        summary: '메모 삭제(공백 입력 시 null 처리)',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '투두 수정 성공',
    schema: {
      example: {
        httpCode: 200,
        message: '투두가 수정되었습니다.',
        success: true,
        data: {
          todoId: '4cf1c1f2-a5cd-49e9-89a8-6ec87f200001',
          usrId: '00000000-0000-0000-0000-000000000001',
          ctgId: '11111111-1111-1111-1111-111111111111',
          content: '러닝 7km',
          memo: null,
          todoDate: '2026-03-21',
          isCompleted: false,
          completedAt: null,
          sortOrder: 0,
          createdAt: '2026-03-21T12:00:00.000Z',
          updatedAt: '2026-03-22T09:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '수정 대상 필드 누락',
    schema: {
      example: {
        httpCode: 400,
        message: '수정할 항목(ctgId, content, memo) 중 최소 1개는 필요합니다.',
        success: false,
        errorCode: 'TODO_UPDATE_PAYLOAD_EMPTY',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '투두 또는 사용자 소유 카테고리 없음',
    schema: {
      example: {
        httpCode: 404,
        message: '투두를 찾을 수 없습니다.',
        success: false,
        errorCode: 'TODO_NOT_FOUND',
      },
    },
  })
  async update(
    @Request() req: { user?: { userId?: string } },
    @Param('todoId', ParseUUIDPipe) todoId: string,
    @Body() dto: UpdateTodoDto,
  ) {
    const todo = await this.todoService.update(
      this.getUserId(req),
      todoId,
      dto,
    );
    return ApiResponseDto.success(
      todo,
      TodoResponse.TODO_UPDATE_SUCCESS.message,
      TodoResponse.TODO_UPDATE_SUCCESS.httpCode,
    );
  }

  /** @description 로그인 사용자의 투두 완료 상태 변경 API */
  @Patch(':todoId/comp')
  @ApiOperation({
    summary: '투두 완료 상태 변경',
    description:
      '로그인 사용자의 투두 완료 상태를 토글합니다. 완료면 미완료로, 미완료면 완료로 변경합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '투두 완료 상태 변경 성공',
    schema: {
      example: {
        httpCode: 200,
        message: '투두 완료 상태가 변경되었습니다.',
        success: true,
        data: {
          todoId: '4cf1c1f2-a5cd-49e9-89a8-6ec87f200001',
          isCompleted: true,
          completedAt: '2026-03-22T09:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '투두 없음 또는 타 사용자 투두 접근',
    schema: {
      example: {
        httpCode: 404,
        message: '투두를 찾을 수 없습니다.',
        success: false,
        errorCode: 'TODO_NOT_FOUND',
      },
    },
  })
  async updateCompletion(
    @Request() req: { user?: { userId?: string } },
    @Param('todoId', ParseUUIDPipe) todoId: string,
  ) {
    const todo = await this.todoService.updateCompletion(
      this.getUserId(req),
      todoId,
    );
    return ApiResponseDto.success(
      todo,
      TodoResponse.TODO_COMPLETION_UPDATE_SUCCESS.message,
      TodoResponse.TODO_COMPLETION_UPDATE_SUCCESS.httpCode,
    );
  }

  /** @description 로그인 사용자의 기존 투두를 오늘 날짜로 복제하는 API */
  @Post(':todoId/repeat/today')
  @ApiOperation({
    summary: '오늘 또 하기',
    description: '다른 날짜에 등록된 투두를 오늘 날짜의 새 투두로 추가합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '오늘 또 하기 성공',
    schema: {
      example: {
        httpCode: 201,
        message: '오늘 또 하기 투두가 추가되었습니다.',
        success: true,
        data: {
          todoId: '4cf1c1f2-a5cd-49e9-89a8-6ec87f200002',
          usrId: '00000000-0000-0000-0000-000000000001',
          ctgId: '11111111-1111-1111-1111-111111111111',
          content: '러닝 5km',
          memo: '아침 7시 한강',
          todoDate: '2026-03-22',
          isCompleted: false,
          completedAt: null,
          sortOrder: 1,
          createdAt: '2026-03-22T09:00:00.000Z',
          updatedAt: '2026-03-22T09:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '원본 투두 날짜 제약 위반',
    schema: {
      example: {
        httpCode: 400,
        message: '오늘 또 하기는 오늘이 아닌 날짜의 투두만 가능합니다.',
        success: false,
        errorCode: 'TODO_REPEAT_TODAY_SOURCE_INVALID',
      },
    },
  })
  async repeatToday(
    @Request() req: { user?: { userId?: string } },
    @Param('todoId', ParseUUIDPipe) todoId: string,
  ) {
    const todo = await this.todoService.repeatToday(
      this.getUserId(req),
      todoId,
    );
    return ApiResponseDto.success(
      todo,
      TodoResponse.TODO_REPEAT_TODAY_SUCCESS.message,
      TodoResponse.TODO_REPEAT_TODAY_SUCCESS.httpCode,
    );
  }

  /** @description 로그인 사용자의 오늘 투두를 내일 날짜로 복제하는 API */
  @Post(':todoId/repeat/tomorrow')
  @ApiOperation({
    summary: '내일 또 하기',
    description: '오늘 날짜에 등록된 투두를 내일 날짜의 새 투두로 추가합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '내일 또 하기 성공',
    schema: {
      example: {
        httpCode: 201,
        message: '내일 또 하기 투두가 추가되었습니다.',
        success: true,
        data: {
          todoId: '4cf1c1f2-a5cd-49e9-89a8-6ec87f200003',
          usrId: '00000000-0000-0000-0000-000000000001',
          ctgId: '11111111-1111-1111-1111-111111111111',
          content: '러닝 5km',
          memo: '아침 7시 한강',
          todoDate: '2026-03-23',
          isCompleted: false,
          completedAt: null,
          sortOrder: 0,
          createdAt: '2026-03-22T09:00:00.000Z',
          updatedAt: '2026-03-22T09:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '원본 투두 날짜 제약 위반',
    schema: {
      example: {
        httpCode: 400,
        message: '내일 또 하기는 오늘 날짜의 투두만 가능합니다.',
        success: false,
        errorCode: 'TODO_REPEAT_TOMORROW_SOURCE_INVALID',
      },
    },
  })
  async repeatTomorrow(
    @Request() req: { user?: { userId?: string } },
    @Param('todoId', ParseUUIDPipe) todoId: string,
  ) {
    const todo = await this.todoService.repeatTomorrow(
      this.getUserId(req),
      todoId,
    );
    return ApiResponseDto.success(
      todo,
      TodoResponse.TODO_REPEAT_TOMORROW_SUCCESS.message,
      TodoResponse.TODO_REPEAT_TOMORROW_SUCCESS.httpCode,
    );
  }

  /** @description 로그인 사용자의 투두를 여러 날짜에 복제하는 API */
  @Post(':todoId/repeat/next')
  @ApiOperation({
    summary: '다음에 또 하기',
    description:
      '원본 투두를 요청한 날짜 배열(최소 1개)에 각각 새 투두로 추가합니다.',
  })
  @ApiBody({
    type: RepeatNextTodoDto,
    examples: {
      default: {
        value: {
          dates: ['2026-03-25', '2026-03-30', '2026-04-02'],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '다음에 또 하기 성공',
    schema: {
      example: {
        httpCode: 201,
        message: '다음에 또 하기 투두가 추가되었습니다.',
        success: true,
        data: [
          {
            todoId: '4cf1c1f2-a5cd-49e9-89a8-6ec87f200004',
            todoDate: '2026-03-25',
          },
          {
            todoId: '4cf1c1f2-a5cd-49e9-89a8-6ec87f200005',
            todoDate: '2026-03-30',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '날짜 형식 오류 또는 원본 날짜 중복 지정',
    schema: {
      example: {
        httpCode: 400,
        message: '다음에 또 하기는 원본과 다른 날짜만 선택할 수 있습니다.',
        success: false,
        errorCode: 'TODO_REPEAT_TARGET_SAME_AS_SOURCE',
      },
    },
  })
  async repeatNext(
    @Request() req: { user?: { userId?: string } },
    @Param('todoId', ParseUUIDPipe) todoId: string,
    @Body() dto: RepeatNextTodoDto,
  ) {
    const todos = await this.todoService.repeatNext(
      this.getUserId(req),
      todoId,
      dto.dates,
    );
    return ApiResponseDto.success(
      todos,
      TodoResponse.TODO_REPEAT_NEXT_SUCCESS.message,
      TodoResponse.TODO_REPEAT_NEXT_SUCCESS.httpCode,
    );
  }

  /** @description 로그인 사용자의 투두 삭제 API */
  @Delete(':todoId')
  @HttpCode(200)
  @ApiOperation({
    summary: '투두 삭제',
    description:
      '로그인 사용자의 투두를 소프트 삭제합니다. 삭제된 투두는 목록 조회에서 제외됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '투두 삭제 성공',
    schema: {
      example: {
        httpCode: 200,
        message: '투두가 삭제되었습니다.',
        success: true,
        data: {
          todoId: '4cf1c1f2-a5cd-49e9-89a8-6ec87f200001',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '투두 없음 또는 타 사용자 투두 접근',
    schema: {
      example: {
        httpCode: 404,
        message: '투두를 찾을 수 없습니다.',
        success: false,
        errorCode: 'TODO_NOT_FOUND',
      },
    },
  })
  async delete(
    @Request() req: { user?: { userId?: string } },
    @Param('todoId', ParseUUIDPipe) todoId: string,
  ) {
    const deleted = await this.todoService.delete(this.getUserId(req), todoId);
    return ApiResponseDto.success(
      deleted,
      TodoResponse.TODO_DELETE_SUCCESS.message,
      TodoResponse.TODO_DELETE_SUCCESS.httpCode,
    );
  }

  /** @description 로그인 사용자의 최근 3개월 투두를 키워드로 검색하는 API */
  @Get('search')
  @ApiOperation({
    summary: '투두 검색',
    description:
      '투두 내용(content)을 키워드로 검색하여 오늘 기준 직전 3개월부터 오늘까지의 결과를 반환합니다.',
  })
  @ApiQuery({
    name: 'keyword',
    required: true,
    description: '검색 키워드',
    example: '강릉 여행',
  })
  @ApiResponse({
    status: 200,
    description: '투두 검색 성공',
    schema: {
      example: {
        httpCode: 200,
        message: '투두 검색에 성공했습니다.',
        success: true,
        data: [
          {
            todoDate: '2026-01-20',
            content: '여름 휴가 강릉 여행',
          },
          {
            todoDate: '2026-02-11',
            content: '강릉 여행 가는 날',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '검색어 형식 오류',
    schema: {
      example: {
        httpCode: 400,
        message: '검색어는 공백이 아닌 1~255자여야 합니다.',
        success: false,
        errorCode: 'TODO_SEARCH_KEYWORD_INVALID',
      },
    },
  })
  async search(
    @Request() req: { user?: { userId?: string } },
    @Query() query: SearchTodosQueryDto,
  ) {
    const todos = await this.todoService.search(
      this.getUserId(req),
      query.keyword,
    );
    return ApiResponseDto.success(
      todos,
      TodoResponse.TODO_SEARCH_SUCCESS.message,
      TodoResponse.TODO_SEARCH_SUCCESS.httpCode,
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
