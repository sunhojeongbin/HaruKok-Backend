import { SearchTodoRow } from '../ports/todo.repository.port';

/** @description 투두 목록 응답 데이터 형식 */
export type TodoListItem = {
  todoId: string;
  usrId: string;
  ctgId: string | null;
  content: string;
  memo: string | null;
  todoDate: string;
  isCompleted: boolean;
  completedAt: Date | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

/** @description 투두 검색 응답 데이터 형식 */
export type TodoSearchItem = SearchTodoRow;

/** @description 투두 생성 입력 데이터 형식 */
export type CreateTodoInput = {
  ctgId: string;
  content: string;
  memo?: string;
  todoDate?: string;
};

/** @description 투두 수정 입력 데이터 형식 */
export type UpdateTodoInput = {
  ctgId?: string;
  content?: string;
  memo?: string;
};
