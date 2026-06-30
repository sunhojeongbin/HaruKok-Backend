import { BusinessException } from '../../../../common/exceptions/business.exception';
import { getTodayTodoDate } from '../../domain/policies/todo-date.policy';
import { TodoEntity } from '../../entities/todo.entity';
import { TodoErrorCode } from '../../errors/todo-error-code';
import { TodoRepositoryPort } from '../ports/todo.repository.port';
import { CreateTodoUseCase } from './create-todo.use-case';

function buildTodoEntity(overrides: Partial<TodoEntity> = {}): TodoEntity {
  const now = new Date('2026-04-08T00:00:00.000Z');
  return {
    todoId: '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
    usrId: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
    ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
    rtnId: null,
    content: '운동하기',
    memo: null,
    todoDate: '2026-04-08',
    isCompleted: false,
    completedAt: null,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
    deletedAt: null,
    usr: undefined as never,
    ctg: null,
    rtn: null,
    ...overrides,
  };
}

describe('CreateTodoUseCase', () => {
  let todoRepository: jest.Mocked<TodoRepositoryPort>;
  let useCase: CreateTodoUseCase;

  beforeEach(() => {
    todoRepository = {
      isCategoryOwnedByUser: jest.fn(),
      findByIdAndUser: jest.fn(),
      createAndSave: jest.fn(),
      createAndSaveMany: jest.fn(),
      save: jest.fn(),
      toggleCompletionByIdAndUser: jest.fn(),
      softDeleteByIdAndUser: jest.fn(),
      findByUserAndMonth: jest.fn(),
      findTodayByUsers: jest.fn(),
      searchByUserAndDateRange: jest.fn(),
    };
    useCase = new CreateTodoUseCase(todoRepository);
  });

  const resolveErrorCode = async (
    action: () => Promise<unknown>,
  ): Promise<string | undefined> => {
    try {
      await action();
      return undefined;
    } catch (error) {
      if (!(error instanceof BusinessException)) {
        throw error;
      }

      const response = error.getResponse();
      if (!response || typeof response !== 'object') {
        return undefined;
      }
      return (response as { errorCode?: string }).errorCode;
    }
  };

  it('투두를 생성하고 todoDate 미입력 시 오늘 날짜를 적용한다', async () => {
    todoRepository.isCategoryOwnedByUser.mockResolvedValue(true);
    todoRepository.createAndSave.mockResolvedValue(
      buildTodoEntity({
        todoDate: getTodayTodoDate(),
        content: '러닝 5km',
        memo: '아침',
      }),
    );

    const result = await useCase.execute(
      '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
      {
        ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
        content: '  러닝 5km  ',
        memo: '  아침  ',
      },
    );

    expect(todoRepository.createAndSave.mock.calls).toEqual([
      [
        {
          usrId: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
          ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
          content: '러닝 5km',
          memo: '아침',
          todoDate: getTodayTodoDate(),
        },
      ],
    ]);
    expect(result.content).toBe('러닝 5km');
    expect(result.memo).toBe('아침');
  });

  it('카테고리가 본인 소유가 아니면 예외를 던진다', async () => {
    todoRepository.isCategoryOwnedByUser.mockResolvedValue(false);

    await expect(
      resolveErrorCode(() =>
        useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', {
          ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
          content: '운동',
        }),
      ),
    ).resolves.toBe(TodoErrorCode.TODO_CATEGORY_NOT_FOUND);
  });

  it('내용이 비어 있으면 예외를 던진다', async () => {
    await expect(
      useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', {
        ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
        content: '   ',
      }),
    ).rejects.toThrow(BusinessException);
    await expect(
      resolveErrorCode(() =>
        useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', {
          ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
          content: '   ',
        }),
      ),
    ).resolves.toBe(TodoErrorCode.TODO_CONTENT_INVALID);
  });

  it('저장소 예외를 TODO_CREATE_FAILED로 변환한다', async () => {
    todoRepository.isCategoryOwnedByUser.mockResolvedValue(true);
    todoRepository.createAndSave.mockRejectedValue(new Error('db error'));

    await expect(
      resolveErrorCode(() =>
        useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', {
          ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
          content: '운동',
        }),
      ),
    ).resolves.toBe(TodoErrorCode.TODO_CREATE_FAILED);
  });
});
