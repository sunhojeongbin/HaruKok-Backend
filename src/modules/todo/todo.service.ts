import { Inject, Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { BusinessException } from '../../common/exceptions/business.exception';
import { TodoResponse } from '../../common/response/todo.response';
import { CreateTodoDto } from './dtos/create-todo.dto';
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
        todoDate: this.getTodayDate(),
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
}
