import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { TodoErrorCode } from '../../errors/todo-error-code';
import { toTodoListItem } from '../mappers/todo-result.mapper';
import { resolveTodoMonthRange } from '../policies/todo-validation.policy';
import {
  TODO_REPOSITORY,
  TodoRepositoryPort,
} from '../ports/todo.repository.port';
import { TodoListItem } from '../types/todo.type';

@Injectable()
export class GetTodoListUseCase {
  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepositoryPort,
  ) {}

  async execute(userId: string, yearMonth?: string): Promise<TodoListItem[]> {
    const { startDate, endDate } = resolveTodoMonthRange(yearMonth);

    try {
      const todos = await this.todoRepository.findByUserAndMonth(
        userId,
        startDate,
        endDate,
      );
      return todos.map((todo) => toTodoListItem(todo));
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException(TodoErrorCode.TODO_LIST_FAILED);
    }
  }
}
