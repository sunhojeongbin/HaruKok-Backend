import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { TodoErrorCode } from '../../errors/todo-error-code';
import { throwTodoPersistenceException } from '../policies/todo-persistence-error.policy';
import {
  TODO_REPOSITORY,
  TodoRepositoryPort,
} from '../ports/todo.repository.port';

@Injectable()
export class DeleteTodoUseCase {
  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepositoryPort,
  ) {}

  async execute(userId: string, todoId: string): Promise<{ todoId: string }> {
    try {
      const isDeleted = await this.todoRepository.softDeleteByIdAndUser(
        todoId,
        userId,
      );
      if (!isDeleted) {
        throw new BusinessException(TodoErrorCode.TODO_NOT_FOUND);
      }

      return { todoId };
    } catch (error) {
      throwTodoPersistenceException(error, TodoErrorCode.TODO_DELETE_FAILED);
    }
  }
}
