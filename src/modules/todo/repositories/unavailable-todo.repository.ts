import { Injectable } from '@nestjs/common';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { TodoResponse } from '../../../common/response/todo.response';
import { TodoEntity } from '../entities/todo.entity';
import { CreateTodoParams, TodoRepositoryPort } from './todo.repository.port';

/** @description SKIP_DB 환경에서 사용하는 투두 저장소 */
@Injectable()
export class UnavailableTodoRepository implements TodoRepositoryPort {
  private rejectRepositoryNotReady<T>(): Promise<T> {
    return Promise.reject(
      new BusinessException(TodoResponse.TODO_REPOSITORY_NOT_READY),
    );
  }

  private consume(...args: unknown[]): void {
    void args;
  }

  isCategoryOwnedByUser(_usrId: string, _ctgId: string): Promise<boolean> {
    this.consume(_usrId, _ctgId);
    return this.rejectRepositoryNotReady();
  }

  createAndSave(_params: CreateTodoParams): Promise<TodoEntity> {
    this.consume(_params);
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
}
