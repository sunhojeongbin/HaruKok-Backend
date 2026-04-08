import { Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { TodoErrorCode } from '../../errors/todo-error-code';
import { TodoEntity } from '../../entities/todo.entity';
import {
  CreateTodoParams,
  SearchTodoRow,
  TodoRepositoryPort,
} from '../../application/ports/todo.repository.port';

/** @description SKIP_DB 환경에서 사용하는 투두 저장소 */
@Injectable()
export class UnavailableTodoRepository implements TodoRepositoryPort {
  private rejectRepositoryNotReady<T>(): Promise<T> {
    return Promise.reject(
      new BusinessException(TodoErrorCode.TODO_REPOSITORY_NOT_READY),
    );
  }

  private consume(...args: unknown[]): void {
    void args;
  }

  isCategoryOwnedByUser(_usrId: string, _ctgId: string): Promise<boolean> {
    this.consume(_usrId, _ctgId);
    return this.rejectRepositoryNotReady();
  }

  findByIdAndUser(_todoId: string, _usrId: string): Promise<TodoEntity | null> {
    this.consume(_todoId, _usrId);
    return this.rejectRepositoryNotReady();
  }

  createAndSave(_params: CreateTodoParams): Promise<TodoEntity> {
    this.consume(_params);
    return this.rejectRepositoryNotReady();
  }

  createAndSaveMany(_paramsList: CreateTodoParams[]): Promise<TodoEntity[]> {
    this.consume(_paramsList);
    return this.rejectRepositoryNotReady();
  }

  save(_todo: TodoEntity): Promise<TodoEntity> {
    this.consume(_todo);
    return this.rejectRepositoryNotReady();
  }

  toggleCompletionByIdAndUser(
    _todoId: string,
    _usrId: string,
  ): Promise<TodoEntity | null> {
    this.consume(_todoId, _usrId);
    return this.rejectRepositoryNotReady();
  }

  softDeleteByIdAndUser(_todoId: string, _usrId: string): Promise<boolean> {
    this.consume(_todoId, _usrId);
    return this.rejectRepositoryNotReady();
  }

  findByUserAndMonth(
    _usrId: string,
    _startDate: string,
    _endDate: string,
  ): Promise<TodoEntity[]> {
    this.consume(_usrId, _startDate, _endDate);
    return this.rejectRepositoryNotReady();
  }

  searchByUserAndDateRange(
    _usrId: string,
    _keyword: string,
    _startDate: string,
    _endDate: string,
  ): Promise<SearchTodoRow[]> {
    this.consume(_usrId, _keyword, _startDate, _endDate);
    return this.rejectRepositoryNotReady();
  }
}
