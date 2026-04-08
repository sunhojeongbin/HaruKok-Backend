import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import {
  getTodayTodoDate,
  getTomorrowTodoDate,
} from '../../domain/policies/todo-date.policy';
import { TodoErrorCode } from '../../errors/todo-error-code';
import { toTodoListItem } from '../mappers/todo-result.mapper';
import { resolveRepeatTodoCategoryId } from '../policies/todo-category.policy';
import { throwTodoPersistenceException } from '../policies/todo-persistence-error.policy';
import {
  TODO_REPOSITORY,
  TodoRepositoryPort,
} from '../ports/todo.repository.port';
import { TodoListItem } from '../types/todo.type';

@Injectable()
export class RepeatTodoTomorrowUseCase {
  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepositoryPort,
  ) {}

  async execute(userId: string, todoId: string): Promise<TodoListItem> {
    const sourceTodo = await this.todoRepository.findByIdAndUser(
      todoId,
      userId,
    );
    if (!sourceTodo) {
      throw new BusinessException(TodoErrorCode.TODO_NOT_FOUND);
    }

    if (sourceTodo.todoDate !== getTodayTodoDate()) {
      throw new BusinessException(
        TodoErrorCode.TODO_REPEAT_TOMORROW_SOURCE_INVALID,
      );
    }

    const repeatCategoryId = await resolveRepeatTodoCategoryId(
      this.todoRepository,
      userId,
      sourceTodo.ctgId,
    );

    try {
      const repeatedTodo = await this.todoRepository.createAndSave({
        usrId: userId,
        ctgId: repeatCategoryId,
        content: sourceTodo.content,
        memo: sourceTodo.memo,
        todoDate: getTomorrowTodoDate(),
      });
      return toTodoListItem(repeatedTodo);
    } catch (error) {
      throwTodoPersistenceException(
        error,
        TodoErrorCode.TODO_REPEAT_TOMORROW_FAILED,
      );
    }
  }
}
