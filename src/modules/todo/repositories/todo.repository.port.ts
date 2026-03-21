import { TodoEntity } from '../entities/todo.entity';

export const TODO_REPOSITORY = Symbol('TODO_REPOSITORY');

/** @description 투두 생성 저장 파라미터 */
export type CreateTodoParams = {
  usrId: string;
  ctgId: string;
  content: string;
  memo: string | null;
  todoDate: string;
};

/** @description 투두 저장소 추상화 */
export interface TodoRepositoryPort {
  isCategoryOwnedByUser(usrId: string, ctgId: string): Promise<boolean>;

  createAndSave(params: CreateTodoParams): Promise<TodoEntity>;

  findByUserAndMonth(
    usrId: string,
    startDate: string,
    endDate: string,
  ): Promise<TodoEntity[]>;
}
