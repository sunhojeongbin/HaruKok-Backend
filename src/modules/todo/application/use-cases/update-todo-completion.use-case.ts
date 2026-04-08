import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { TodoErrorCode } from '../../errors/todo-error-code';
import { toTodoListItem } from '../mappers/todo-result.mapper';
import { throwTodoPersistenceException } from '../policies/todo-persistence-error.policy';
import {
  TODO_REPOSITORY,
  TodoRepositoryPort,
} from '../ports/todo.repository.port';
import { TodoListItem } from '../types/todo.type';

@Injectable()
export class UpdateTodoCompletionUseCase {
  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepositoryPort,
  ) {}

  async execute(userId: string, todoId: string): Promise<TodoListItem> {
    try {
      const updatedTodo = await this.todoRepository.toggleCompletionByIdAndUser(
        todoId,
        userId,
      );
      if (!updatedTodo) {
        throw new BusinessException(TodoErrorCode.TODO_NOT_FOUND);
      }

      return toTodoListItem(updatedTodo);
    } catch (error) {
      throwTodoPersistenceException(
        error,
        TodoErrorCode.TODO_COMPLETION_UPDATE_FAILED,
      );
    }
  }
}
