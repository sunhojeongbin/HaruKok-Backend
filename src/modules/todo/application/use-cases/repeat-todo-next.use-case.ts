import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { TodoErrorCode } from '../../errors/todo-error-code';
import { toTodoListItem } from '../mappers/todo-result.mapper';
import { resolveRepeatTodoCategoryId } from '../policies/todo-category.policy';
import { throwTodoPersistenceException } from '../policies/todo-persistence-error.policy';
import { validateTodoRepeatDates } from '../policies/todo-validation.policy';
import {
  TODO_REPOSITORY,
  TodoRepositoryPort,
} from '../ports/todo.repository.port';
import { TodoListItem } from '../types/todo.type';

@Injectable()
export class RepeatTodoNextUseCase {
  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepositoryPort,
  ) {}

  async execute(
    userId: string,
    todoId: string,
    dates: string[],
  ): Promise<TodoListItem[]> {
    const sourceTodo = await this.todoRepository.findByIdAndUser(
      todoId,
      userId,
    );
    if (!sourceTodo) {
      throw new BusinessException(TodoErrorCode.TODO_NOT_FOUND);
    }

    validateTodoRepeatDates(dates, sourceTodo.todoDate);

    const repeatCategoryId = await resolveRepeatTodoCategoryId(
      this.todoRepository,
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

      return repeatedTodos.map((todo) => toTodoListItem(todo));
    } catch (error) {
      throwTodoPersistenceException(
        error,
        TodoErrorCode.TODO_REPEAT_NEXT_FAILED,
      );
    }
  }
}
