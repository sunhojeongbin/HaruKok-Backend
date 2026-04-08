import { BusinessException } from '../../../../common/exceptions/business.exception';
import { TodoErrorCode } from '../../errors/todo-error-code';
import { TodoRepositoryPort } from '../ports/todo.repository.port';

/** @description 사용자 소유의 활성 카테고리인지 검증한다. */
export async function ensureOwnedTodoCategory(
  todoRepository: TodoRepositoryPort,
  userId: string,
  ctgId: string,
): Promise<void> {
  const isOwnedCategory = await todoRepository.isCategoryOwnedByUser(
    userId,
    ctgId,
  );
  if (!isOwnedCategory) {
    throw new BusinessException(TodoErrorCode.TODO_CATEGORY_NOT_FOUND);
  }
}

/** @description 투두 복제 시 사용할 카테고리 유효성(소유/활성)을 검증한다. */
export async function resolveRepeatTodoCategoryId(
  todoRepository: TodoRepositoryPort,
  userId: string,
  ctgId: string | null,
): Promise<string> {
  if (!ctgId) {
    throw new BusinessException(TodoErrorCode.TODO_CATEGORY_NOT_FOUND);
  }

  await ensureOwnedTodoCategory(todoRepository, userId, ctgId);
  return ctgId;
}
