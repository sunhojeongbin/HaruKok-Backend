import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { TodoErrorCode } from '../../errors/todo-error-code';
import { toTodoSearchItem } from '../mappers/todo-result.mapper';
import {
  resolveTodoSearchRange,
  validateTodoSearchKeyword,
} from '../policies/todo-validation.policy';
import {
  TODO_REPOSITORY,
  TodoRepositoryPort,
} from '../ports/todo.repository.port';
import { TodoSearchItem } from '../types/todo.type';

@Injectable()
export class SearchTodosUseCase {
  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepositoryPort,
  ) {}

  async execute(userId: string, keyword: string): Promise<TodoSearchItem[]> {
    const normalizedKeyword = validateTodoSearchKeyword(keyword);
    const { startDate, endDate } = resolveTodoSearchRange();

    try {
      const todos = await this.todoRepository.searchByUserAndDateRange(
        userId,
        normalizedKeyword,
        startDate,
        endDate,
      );
      return todos.map((todo) => toTodoSearchItem(todo));
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException(TodoErrorCode.TODO_SEARCH_FAILED);
    }
  }
}
