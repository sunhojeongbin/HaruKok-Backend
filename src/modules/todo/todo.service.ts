import { Inject, Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { BusinessException } from '../../common/exceptions/business.exception';
import { TodoResponse } from '../../common/response/todo.response';
import { CreateTodoDto } from './dtos/create-todo.dto';
import { UpdateTodoDto } from './dtos/update-todo.dto';
import { TodoEntity } from './entities/todo.entity';
import {
  TODO_REPOSITORY,
  TodoRepositoryPort,
} from './repositories/todo.repository.port';

/** @description 투두 목록 응답 데이터 형식 */
type TodoListItem = {
  todoId: string;
  usrId: string;
  ctgId: string | null;
  content: string;
  memo: string | null;
  todoDate: string;
  isCompleted: boolean;
  completedAt: Date | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

/** @description 투두 비즈니스 로직을 처리하는 서비스 */
@Injectable()
export class TodoService {
  private readonly YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
  private readonly DATE_PATTERN =
    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  private readonly MAX_CONTENT_LENGTH = 255;
  private readonly MAX_MEMO_LENGTH = 1000;

  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepositoryPort,
  ) {}

  /** @description 엔티티를 API 응답 객체로 변환 */
  private toTodoListItem(todo: TodoEntity): TodoListItem {
    return {
      todoId: todo.todoId,
      usrId: todo.usrId,
      ctgId: todo.ctgId,
      content: todo.content,
      memo: todo.memo,
      todoDate: todo.todoDate,
      isCompleted: todo.isCompleted,
      completedAt: todo.completedAt,
      sortOrder: todo.sortOrder,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    };
  }

  /** @description 오늘 날짜를 YYYY-MM-DD 형식으로 반환 */
  private getTodayDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** @description 날짜 문자열(YYYY-MM-DD)이 실제 달력 날짜인지 확인 */
  private isValidDateText(dateText: string): boolean {
    if (!this.DATE_PATTERN.test(dateText)) {
      return false;
    }

    const [year, month, day] = dateText.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    return (
      parsedDate.getUTCFullYear() === year &&
      parsedDate.getUTCMonth() === month - 1 &&
      parsedDate.getUTCDate() === day
    );
  }

  /** @description YYYY-MM-DD 날짜에 일 수를 더해 YYYY-MM-DD로 반환 */
  private addDays(dateText: string, days: number): string {
    const [year, month, day] = dateText.split('-').map(Number);
    const baseDate = new Date(Date.UTC(year, month - 1, day));
    baseDate.setUTCDate(baseDate.getUTCDate() + days);

    const nextYear = baseDate.getUTCFullYear();
    const nextMonth = String(baseDate.getUTCMonth() + 1).padStart(2, '0');
    const nextDay = String(baseDate.getUTCDate()).padStart(2, '0');
    return `${nextYear}-${nextMonth}-${nextDay}`;
  }

  /** @description 오늘 기준 내일 날짜를 YYYY-MM-DD 형식으로 반환 */
  private getTomorrowDate(): string {
    return this.addDays(this.getTodayDate(), 1);
  }

  /** @description 할 일 내용을 정규화하고 검증 */
  private normalizeContent(content: string): string {
    const normalizedContent = content.trim();
    if (
      !normalizedContent ||
      normalizedContent.length > this.MAX_CONTENT_LENGTH
    ) {
      throw new BusinessException(TodoResponse.TODO_CONTENT_INVALID);
    }
    return normalizedContent;
  }

  /** @description 메모를 정규화하고 검증 */
  private normalizeMemo(memo?: string): string | null {
    if (memo === undefined) {
      return null;
    }

    const normalizedMemo = memo.trim();
    if (!normalizedMemo) {
      return null;
    }

    if (normalizedMemo.length > this.MAX_MEMO_LENGTH) {
      throw new BusinessException(TodoResponse.TODO_MEMO_INVALID);
    }

    return normalizedMemo;
  }

  /** @description 투두 복제 시 사용할 카테고리 유효성(소유/활성)을 검증 */
  private async resolveRepeatCategoryId(
    userId: string,
    ctgId: string | null,
  ): Promise<string> {
    if (!ctgId) {
      throw new BusinessException(TodoResponse.TODO_CATEGORY_NOT_FOUND);
    }

    const isOwnedCategory = await this.todoRepository.isCategoryOwnedByUser(
      userId,
      ctgId,
    );
    if (!isOwnedCategory) {
      throw new BusinessException(TodoResponse.TODO_CATEGORY_NOT_FOUND);
    }

    return ctgId;
  }

  /** @description YYYY-MM을 월 시작/종료일로 변환 */
  private resolveMonthRange(yearMonth?: string): {
    startDate: string;
    endDate: string;
  } {
    let year: number;
    let month: number;

    if (yearMonth) {
      if (!this.YEAR_MONTH_PATTERN.test(yearMonth)) {
        throw new BusinessException(TodoResponse.TODO_QUERY_MONTH_INVALID);
      }
      const [parsedYear, parsedMonth] = yearMonth.split('-').map(Number);
      year = parsedYear;
      month = parsedMonth;
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }

    const monthText = String(month).padStart(2, '0');
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const lastDayText = String(lastDay).padStart(2, '0');

    return {
      startDate: `${year}-${monthText}-01`,
      endDate: `${year}-${monthText}-${lastDayText}`,
    };
  }

  /**
   * @description 로그인 사용자의 월별 투두 목록 조회
   * @param userId 사용자 ID
   * @param yearMonth 조회 대상 년-월(YYYY-MM), 미입력 시 현재 월
   */
  async getList(userId: string, yearMonth?: string): Promise<TodoListItem[]> {
    const { startDate, endDate } = this.resolveMonthRange(yearMonth);

    try {
      const todos = await this.todoRepository.findByUserAndMonth(
        userId,
        startDate,
        endDate,
      );
      return todos.map((todo) => this.toTodoListItem(todo));
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException(TodoResponse.TODO_LIST_FAILED);
    }
  }

  /**
   * @description 로그인 사용자의 투두 생성
   * @param userId 사용자 ID
   * @param dto 투두 생성 요청 데이터
   */
  async create(userId: string, dto: CreateTodoDto): Promise<TodoListItem> {
    const content = this.normalizeContent(dto.content);
    const memo = this.normalizeMemo(dto.memo);
    const todoDate = dto.todoDate ?? this.getTodayDate();

    if (!this.isValidDateText(todoDate)) {
      throw new BusinessException(TodoResponse.TODO_DATE_INVALID);
    }

    const isOwnedCategory = await this.todoRepository.isCategoryOwnedByUser(
      userId,
      dto.ctgId,
    );
    if (!isOwnedCategory) {
      throw new BusinessException(TodoResponse.TODO_CATEGORY_NOT_FOUND);
    }

    try {
      const todo = await this.todoRepository.createAndSave({
        usrId: userId,
        ctgId: dto.ctgId,
        content,
        memo,
        todoDate,
      });

      return this.toTodoListItem(todo);
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        throw new BusinessException(TodoResponse.TODO_CREATE_FAILED);
      }

      throw new BusinessException(TodoResponse.TODO_CREATE_FAILED);
    }
  }

  /**
   * @description 로그인 사용자의 투두를 수정
   * @param userId 사용자 ID
   * @param todoId 수정할 투두 ID
   * @param dto 수정 데이터(ctgId/content/memo)
   */
  async update(
    userId: string,
    todoId: string,
    dto: UpdateTodoDto,
  ): Promise<TodoListItem> {
    if (
      dto.ctgId === undefined &&
      dto.content === undefined &&
      dto.memo === undefined
    ) {
      throw new BusinessException(TodoResponse.TODO_UPDATE_PAYLOAD_EMPTY);
    }

    const todo = await this.todoRepository.findByIdAndUser(todoId, userId);
    if (!todo) {
      throw new BusinessException(TodoResponse.TODO_NOT_FOUND);
    }

    if (dto.ctgId !== undefined) {
      const isOwnedCategory = await this.todoRepository.isCategoryOwnedByUser(
        userId,
        dto.ctgId,
      );
      if (!isOwnedCategory) {
        throw new BusinessException(TodoResponse.TODO_CATEGORY_NOT_FOUND);
      }
      todo.ctgId = dto.ctgId;
    }

    if (dto.content !== undefined) {
      todo.content = this.normalizeContent(dto.content);
    }

    if (dto.memo !== undefined) {
      todo.memo = this.normalizeMemo(dto.memo);
    }

    try {
      const updatedTodo = await this.todoRepository.save(todo);
      return this.toTodoListItem(updatedTodo);
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        throw new BusinessException(TodoResponse.TODO_UPDATE_FAILED);
      }

      throw new BusinessException(TodoResponse.TODO_UPDATE_FAILED);
    }
  }

  /**
   * @description 로그인 사용자의 투두 완료 상태를 변경
   * @param userId 사용자 ID
   * @param todoId 완료 상태를 변경할 투두 ID
   * @returns 완료 상태가 토글된 투두 정보
   */
  async updateCompletion(
    userId: string,
    todoId: string,
  ): Promise<TodoListItem> {
    try {
      const updatedTodo = await this.todoRepository.toggleCompletionByIdAndUser(
        todoId,
        userId,
      );
      if (!updatedTodo) {
        throw new BusinessException(TodoResponse.TODO_NOT_FOUND);
      }

      return this.toTodoListItem(updatedTodo);
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        throw new BusinessException(TodoResponse.TODO_COMPLETION_UPDATE_FAILED);
      }

      throw new BusinessException(TodoResponse.TODO_COMPLETION_UPDATE_FAILED);
    }
  }

  /**
   * @description 로그인 사용자의 기존 투두를 오늘 날짜로 복제
   * @param userId 사용자 ID
   * @param todoId 복제할 투두 ID
   */
  async repeatToday(userId: string, todoId: string): Promise<TodoListItem> {
    const sourceTodo = await this.todoRepository.findByIdAndUser(
      todoId,
      userId,
    );
    if (!sourceTodo) {
      throw new BusinessException(TodoResponse.TODO_NOT_FOUND);
    }

    const todayDate = this.getTodayDate();
    if (sourceTodo.todoDate === todayDate) {
      throw new BusinessException(
        TodoResponse.TODO_REPEAT_TODAY_SOURCE_INVALID,
      );
    }

    const repeatCategoryId = await this.resolveRepeatCategoryId(
      userId,
      sourceTodo.ctgId,
    );

    try {
      const repeatedTodo = await this.todoRepository.createAndSave({
        usrId: userId,
        ctgId: repeatCategoryId,
        content: sourceTodo.content,
        memo: sourceTodo.memo,
        todoDate: todayDate,
      });
      return this.toTodoListItem(repeatedTodo);
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        throw new BusinessException(TodoResponse.TODO_REPEAT_TODAY_FAILED);
      }

      throw new BusinessException(TodoResponse.TODO_REPEAT_TODAY_FAILED);
    }
  }

  /**
   * @description 로그인 사용자의 오늘 투두를 내일 날짜로 복제
   * @param userId 사용자 ID
   * @param todoId 복제할 투두 ID
   */
  async repeatTomorrow(userId: string, todoId: string): Promise<TodoListItem> {
    const sourceTodo = await this.todoRepository.findByIdAndUser(
      todoId,
      userId,
    );
    if (!sourceTodo) {
      throw new BusinessException(TodoResponse.TODO_NOT_FOUND);
    }

    const todayDate = this.getTodayDate();
    if (sourceTodo.todoDate !== todayDate) {
      throw new BusinessException(
        TodoResponse.TODO_REPEAT_TOMORROW_SOURCE_INVALID,
      );
    }

    const repeatCategoryId = await this.resolveRepeatCategoryId(
      userId,
      sourceTodo.ctgId,
    );

    try {
      const repeatedTodo = await this.todoRepository.createAndSave({
        usrId: userId,
        ctgId: repeatCategoryId,
        content: sourceTodo.content,
        memo: sourceTodo.memo,
        todoDate: this.getTomorrowDate(),
      });
      return this.toTodoListItem(repeatedTodo);
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        throw new BusinessException(TodoResponse.TODO_REPEAT_TOMORROW_FAILED);
      }

      throw new BusinessException(TodoResponse.TODO_REPEAT_TOMORROW_FAILED);
    }
  }

  /**
   * @description 로그인 사용자의 기존 투두를 여러 날짜로 복제
   * @param userId 사용자 ID
   * @param todoId 복제할 투두 ID
   * @param dates 복제 대상 날짜 배열(최소 1개)
   */
  async repeatNext(
    userId: string,
    todoId: string,
    dates: string[],
  ): Promise<TodoListItem[]> {
    const sourceTodo = await this.todoRepository.findByIdAndUser(
      todoId,
      userId,
    );
    if (!sourceTodo) {
      throw new BusinessException(TodoResponse.TODO_NOT_FOUND);
    }

    const hasInvalidDate = dates.some(
      (dateText) => !this.isValidDateText(dateText),
    );
    if (hasInvalidDate) {
      throw new BusinessException(TodoResponse.TODO_REPEAT_DATE_INVALID);
    }

    const hasSameDateAsSource = dates.some(
      (dateText) => dateText === sourceTodo.todoDate,
    );
    if (hasSameDateAsSource) {
      throw new BusinessException(
        TodoResponse.TODO_REPEAT_TARGET_SAME_AS_SOURCE,
      );
    }

    const repeatCategoryId = await this.resolveRepeatCategoryId(
      userId,
      sourceTodo.ctgId,
    );

    try {
      const repeatedTodos = await this.todoRepository.createAndSaveMany(
        dates.map((dateText) => ({
          usrId: userId,
          ctgId: repeatCategoryId,
          content: sourceTodo.content,
          memo: sourceTodo.memo,
          todoDate: dateText,
        })),
      );

      return repeatedTodos.map((todo) => this.toTodoListItem(todo));
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        throw new BusinessException(TodoResponse.TODO_REPEAT_NEXT_FAILED);
      }

      throw new BusinessException(TodoResponse.TODO_REPEAT_NEXT_FAILED);
    }
  }

  /**
   * @description 로그인 사용자의 투두를 소프트 삭제
   * @param userId 사용자 ID
   * @param todoId 삭제할 투두 ID
   * @returns 삭제된 투두 ID
   */
  async delete(userId: string, todoId: string): Promise<{ todoId: string }> {
    try {
      const isDeleted = await this.todoRepository.softDeleteByIdAndUser(
        todoId,
        userId,
      );
      if (!isDeleted) {
        throw new BusinessException(TodoResponse.TODO_NOT_FOUND);
      }

      return { todoId };
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        throw new BusinessException(TodoResponse.TODO_DELETE_FAILED);
      }

      throw new BusinessException(TodoResponse.TODO_DELETE_FAILED);
    }
  }
}
