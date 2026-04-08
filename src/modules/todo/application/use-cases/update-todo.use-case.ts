import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { TodoErrorCode } from '../../errors/todo-error-code';
import { ensureOwnedTodoCategory } from '../policies/todo-category.policy';
import { toTodoListItem } from '../mappers/todo-result.mapper';
import { throwTodoPersistenceException } from '../policies/todo-persistence-error.policy';
import {
  validateTodoContent,
  validateTodoMemo,
} from '../policies/todo-validation.policy';
import {
  TODO_REPOSITORY,
  TodoRepositoryPort,
} from '../ports/todo.repository.port';
import { TodoListItem, UpdateTodoInput } from '../types/todo.type';

@Injectable()
export class UpdateTodoUseCase {
  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepositoryPort,
  ) {}

  async execute(
    userId: string,
    todoId: string,
    input: UpdateTodoInput,
  ): Promise<TodoListItem> {
    if (
      input.ctgId === undefined &&
      input.content === undefined &&
      input.memo === undefined
    ) {
      throw new BusinessException(TodoErrorCode.TODO_UPDATE_PAYLOAD_EMPTY);
    }

    const todo = await this.todoRepository.findByIdAndUser(todoId, userId);
    if (!todo) {
      throw new BusinessException(TodoErrorCode.TODO_NOT_FOUND);
    }

    if (input.ctgId !== undefined) {
      await ensureOwnedTodoCategory(this.todoRepository, userId, input.ctgId);
      todo.ctgId = input.ctgId;
    }

    if (input.content !== undefined) {
      todo.content = validateTodoContent(input.content);
    }

    if (input.memo !== undefined) {
      todo.memo = validateTodoMemo(input.memo);
    }

    try {
      const updatedTodo = await this.todoRepository.save(todo);
      return toTodoListItem(updatedTodo);
    } catch (error) {
      throwTodoPersistenceException(error, TodoErrorCode.TODO_UPDATE_FAILED);
    }
  }
}
