import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { TodoErrorCode } from '../../errors/todo-error-code';
import { toTodoListItem } from '../mappers/todo-result.mapper';
import {
  TODO_REPOSITORY,
  TodoRepositoryPort,
} from '../ports/todo.repository.port';
import { TodoListItem } from '../types/todo.type';

@Injectable()
export class GetTodoByIdUseCase {
  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepositoryPort,
  ) {}

  async execute(userId: string, todoId: string): Promise<TodoListItem> {
    try {
      const todo = await this.todoRepository.findByIdAndUser(todoId, userId);
      if (!todo) {
        throw new BusinessException(TodoErrorCode.TODO_NOT_FOUND);
      }
      return toTodoListItem(todo);
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException(TodoErrorCode.TODO_GET_FAILED);
    }
  }
}
