import { Inject, Injectable } from '@nestjs/common';
import { getTodayTodoDate } from '../../domain/policies/todo-date.policy';
import { ensureOwnedTodoCategory } from '../policies/todo-category.policy';
import { toTodoListItem } from '../mappers/todo-result.mapper';
import { throwTodoPersistenceException } from '../policies/todo-persistence-error.policy';
import {
  validateTodoContent,
  validateTodoDate,
  validateTodoMemo,
} from '../policies/todo-validation.policy';
import {
  TODO_REPOSITORY,
  TodoRepositoryPort,
} from '../ports/todo.repository.port';
import { CreateTodoInput, TodoListItem } from '../types/todo.type';
import { TodoErrorCode } from '../../errors/todo-error-code';

@Injectable()
export class CreateTodoUseCase {
  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepositoryPort,
  ) {}

  async execute(userId: string, input: CreateTodoInput): Promise<TodoListItem> {
    const content = validateTodoContent(input.content);
    const memo = validateTodoMemo(input.memo);
    const todoDate = input.todoDate ?? getTodayTodoDate();
    validateTodoDate(todoDate);

    await ensureOwnedTodoCategory(this.todoRepository, userId, input.ctgId);

    try {
      const todo = await this.todoRepository.createAndSave({
        usrId: userId,
        ctgId: input.ctgId,
        content,
        memo,
        todoDate,
      });

      return toTodoListItem(todo);
    } catch (error) {
      throwTodoPersistenceException(error, TodoErrorCode.TODO_CREATE_FAILED);
    }
  }
}
