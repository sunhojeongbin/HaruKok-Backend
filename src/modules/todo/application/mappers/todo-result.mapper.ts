import { TodoEntity } from '../../entities/todo.entity';
import { SearchTodoRow } from '../ports/todo.repository.port';
import { TodoListItem, TodoSearchItem } from '../types/todo.type';

/** @description 엔티티를 API 응답 객체로 변환한다. */
export function toTodoListItem(todo: TodoEntity): TodoListItem {
  return {
    todoId: todo.todoId,
    usrId: todo.usrId,
    ctgId: todo.ctgId,
    content: todo.content,
    memo: todo.memo,
    todoDate: todo.todoDate,
    isCompleted: todo.isCompleted,
    completedAt: todo.completedAt,
    sortOrder: todo.sortOrder,
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
  };
}

/** @description 검색 결과 행을 API 응답 객체로 변환한다. */
export function toTodoSearchItem(todo: SearchTodoRow): TodoSearchItem {
  return {
    todoDate: todo.todoDate,
    content: todo.content,
  };
}
