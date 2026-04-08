import { BusinessException } from '../../../../common/exceptions/business.exception';
import { getTodayTodoDate } from '../../domain/policies/todo-date.policy';
import { TodoEntity } from '../../entities/todo.entity';
import { TodoErrorCode } from '../../errors/todo-error-code';
import {
  SearchTodoRow,
  TodoRepositoryPort,
} from '../ports/todo.repository.port';
import { DeleteTodoUseCase } from './delete-todo.use-case';
import { GetTodoByIdUseCase } from './get-todo-by-id.use-case';
import { GetTodoListUseCase } from './get-todo-list.use-case';
import { RepeatTodoNextUseCase } from './repeat-todo-next.use-case';
import { RepeatTodoTodayUseCase } from './repeat-todo-today.use-case';
import { RepeatTodoTomorrowUseCase } from './repeat-todo-tomorrow.use-case';
import { SearchTodosUseCase } from './search-todos.use-case';
import { UpdateTodoCompletionUseCase } from './update-todo-completion.use-case';
import { UpdateTodoUseCase } from './update-todo.use-case';

function buildTodo(overrides: Partial<TodoEntity> = {}): TodoEntity {
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

describe('Todo UseCases', () => {
  let todoRepository: jest.Mocked<TodoRepositoryPort>;

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
      searchByUserAndDateRange: jest.fn(),
    };
  });

  describe('GetTodoByIdUseCase', () => {
    it('투두 상세를 조회한다', async () => {
      todoRepository.findByIdAndUser.mockResolvedValue(buildTodo());
      const useCase = new GetTodoByIdUseCase(todoRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
      );

      expect(result.todoId).toBe('3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081');
      expect(result.content).toBe('운동하기');
    });

    it('투두가 없으면 TODO_NOT_FOUND를 던진다', async () => {
      todoRepository.findByIdAndUser.mockResolvedValue(null);
      const useCase = new GetTodoByIdUseCase(todoRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
          ),
        ),
      ).resolves.toBe(TodoErrorCode.TODO_NOT_FOUND);
    });

    it('저장소 오류는 TODO_GET_FAILED로 변환한다', async () => {
      todoRepository.findByIdAndUser.mockRejectedValue(new Error('db error'));
      const useCase = new GetTodoByIdUseCase(todoRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
          ),
        ),
      ).resolves.toBe(TodoErrorCode.TODO_GET_FAILED);
    });
  });

  describe('GetTodoListUseCase', () => {
    it('월별 목록을 조회한다', async () => {
      todoRepository.findByUserAndMonth.mockResolvedValue([
        buildTodo({ todoId: '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081' }),
        buildTodo({
          todoId: '4c19f5d4-8a7e-40aa-c16b-4d5e6f708192',
          sortOrder: 1,
        }),
      ]);
      const useCase = new GetTodoListUseCase(todoRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        '2026-04',
      );

      expect(result).toHaveLength(2);
      expect(todoRepository.findByUserAndMonth.mock.calls).toEqual([
        ['7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', '2026-04-01', '2026-04-30'],
      ]);
    });

    it('조회 월 포맷이 잘못되면 TODO_QUERY_MONTH_INVALID를 던진다', async () => {
      const useCase = new GetTodoListUseCase(todoRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', '2026/04'),
        ),
      ).resolves.toBe(TodoErrorCode.TODO_QUERY_MONTH_INVALID);
    });
  });

  describe('SearchTodosUseCase', () => {
    it('키워드 검색 결과를 반환한다', async () => {
      const rows: SearchTodoRow[] = [
        { todoDate: '2026-04-08', content: '운동' },
      ];
      todoRepository.searchByUserAndDateRange.mockResolvedValue(rows);
      const useCase = new SearchTodosUseCase(todoRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        '  운동  ',
      );

      expect(result).toEqual([{ todoDate: '2026-04-08', content: '운동' }]);
      expect(todoRepository.searchByUserAndDateRange.mock.calls[0][1]).toBe(
        '운동',
      );
    });

    it('키워드가 비어 있으면 TODO_SEARCH_KEYWORD_INVALID를 던진다', async () => {
      const useCase = new SearchTodosUseCase(todoRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', '   '),
        ),
      ).resolves.toBe(TodoErrorCode.TODO_SEARCH_KEYWORD_INVALID);
    });

    it('저장소 오류는 TODO_SEARCH_FAILED로 변환한다', async () => {
      todoRepository.searchByUserAndDateRange.mockRejectedValue(
        new Error('db error'),
      );
      const useCase = new SearchTodosUseCase(todoRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', '운동'),
        ),
      ).resolves.toBe(TodoErrorCode.TODO_SEARCH_FAILED);
    });
  });

  describe('DeleteTodoUseCase', () => {
    it('정상 삭제면 todoId를 반환한다', async () => {
      todoRepository.softDeleteByIdAndUser.mockResolvedValue(true);
      const useCase = new DeleteTodoUseCase(todoRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
      );

      expect(result).toEqual({
        todoId: '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
      });
    });

    it('삭제 대상이 없으면 TODO_NOT_FOUND를 던진다', async () => {
      todoRepository.softDeleteByIdAndUser.mockResolvedValue(false);
      const useCase = new DeleteTodoUseCase(todoRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
          ),
        ),
      ).resolves.toBe(TodoErrorCode.TODO_NOT_FOUND);
    });

    it('저장소 오류는 TODO_DELETE_FAILED로 변환한다', async () => {
      todoRepository.softDeleteByIdAndUser.mockRejectedValue(
        new Error('db error'),
      );
      const useCase = new DeleteTodoUseCase(todoRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
          ),
        ),
      ).resolves.toBe(TodoErrorCode.TODO_DELETE_FAILED);
    });
  });

  describe('UpdateTodoUseCase', () => {
    it('수정 payload가 비어 있으면 TODO_UPDATE_PAYLOAD_EMPTY를 던진다', async () => {
      const useCase = new UpdateTodoUseCase(todoRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
            {},
          ),
        ),
      ).resolves.toBe(TodoErrorCode.TODO_UPDATE_PAYLOAD_EMPTY);
    });

    it('투두가 없으면 TODO_NOT_FOUND를 던진다', async () => {
      todoRepository.findByIdAndUser.mockResolvedValue(null);
      const useCase = new UpdateTodoUseCase(todoRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
            { content: '새 내용' },
          ),
        ),
      ).resolves.toBe(TodoErrorCode.TODO_NOT_FOUND);
    });

    it('카테고리/내용/메모를 수정해 저장한다', async () => {
      const todo = buildTodo();
      todoRepository.findByIdAndUser.mockResolvedValue(todo);
      todoRepository.isCategoryOwnedByUser.mockResolvedValue(true);
      todoRepository.save.mockImplementation((value) => Promise.resolve(value));
      const useCase = new UpdateTodoUseCase(todoRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
        {
          ctgId: '2af7d3b2-6e5c-4e88-af4f-2b3c4d5e6f70',
          content: '  독서  ',
          memo: '  챕터 1  ',
        },
      );

      expect(result).toEqual(
        expect.objectContaining({
          ctgId: '2af7d3b2-6e5c-4e88-af4f-2b3c4d5e6f70',
          content: '독서',
          memo: '챕터 1',
        }),
      );
      expect(todoRepository.save.mock.calls).toHaveLength(1);
    });

    it('저장소 오류는 TODO_UPDATE_FAILED로 변환한다', async () => {
      todoRepository.findByIdAndUser.mockResolvedValue(buildTodo());
      todoRepository.save.mockRejectedValue(new Error('db error'));
      const useCase = new UpdateTodoUseCase(todoRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
            { content: '변경' },
          ),
        ),
      ).resolves.toBe(TodoErrorCode.TODO_UPDATE_FAILED);
    });
  });

  describe('UpdateTodoCompletionUseCase', () => {
    it('완료 상태를 토글한다', async () => {
      todoRepository.toggleCompletionByIdAndUser.mockResolvedValue(
        buildTodo({ isCompleted: true, completedAt: new Date() }),
      );
      const useCase = new UpdateTodoCompletionUseCase(todoRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
      );

      expect(result.isCompleted).toBe(true);
    });

    it('투두가 없으면 TODO_NOT_FOUND를 던진다', async () => {
      todoRepository.toggleCompletionByIdAndUser.mockResolvedValue(null);
      const useCase = new UpdateTodoCompletionUseCase(todoRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
          ),
        ),
      ).resolves.toBe(TodoErrorCode.TODO_NOT_FOUND);
    });
  });

  describe('RepeatTodoTodayUseCase', () => {
    it('원본 투두가 없으면 TODO_NOT_FOUND를 던진다', async () => {
      todoRepository.findByIdAndUser.mockResolvedValue(null);
      const useCase = new RepeatTodoTodayUseCase(todoRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
          ),
        ),
      ).resolves.toBe(TodoErrorCode.TODO_NOT_FOUND);
    });

    it('원본 날짜가 오늘이면 TODO_REPEAT_TODAY_SOURCE_INVALID를 던진다', async () => {
      todoRepository.findByIdAndUser.mockResolvedValue(
        buildTodo({ todoDate: getTodayTodoDate() }),
      );
      const useCase = new RepeatTodoTodayUseCase(todoRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
          ),
        ),
      ).resolves.toBe(TodoErrorCode.TODO_REPEAT_TODAY_SOURCE_INVALID);
    });

    it('오늘 날짜로 투두를 복제한다', async () => {
      todoRepository.findByIdAndUser.mockResolvedValue(
        buildTodo({
          todoDate: '2026-04-01',
          ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
        }),
      );
      todoRepository.isCategoryOwnedByUser.mockResolvedValue(true);
      todoRepository.createAndSave.mockResolvedValue(
        buildTodo({
          todoId: '4c19f5d4-8a7e-40aa-c16b-4d5e6f708192',
          todoDate: getTodayTodoDate(),
        }),
      );
      const useCase = new RepeatTodoTodayUseCase(todoRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
      );

      expect(result.todoId).toBe('4c19f5d4-8a7e-40aa-c16b-4d5e6f708192');
      expect(result.todoDate).toBe(getTodayTodoDate());
    });
  });

  describe('RepeatTodoTomorrowUseCase', () => {
    it('원본 투두가 없으면 TODO_NOT_FOUND를 던진다', async () => {
      todoRepository.findByIdAndUser.mockResolvedValue(null);
      const useCase = new RepeatTodoTomorrowUseCase(todoRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
          ),
        ),
      ).resolves.toBe(TodoErrorCode.TODO_NOT_FOUND);
    });

    it('원본 날짜가 오늘이 아니면 TODO_REPEAT_TOMORROW_SOURCE_INVALID를 던진다', async () => {
      todoRepository.findByIdAndUser.mockResolvedValue(
        buildTodo({ todoDate: '2026-04-01' }),
      );
      const useCase = new RepeatTodoTomorrowUseCase(todoRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
          ),
        ),
      ).resolves.toBe(TodoErrorCode.TODO_REPEAT_TOMORROW_SOURCE_INVALID);
    });

    it('내일 날짜로 투두를 복제한다', async () => {
      todoRepository.findByIdAndUser.mockResolvedValue(
        buildTodo({
          todoDate: getTodayTodoDate(),
          ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
        }),
      );
      todoRepository.isCategoryOwnedByUser.mockResolvedValue(true);
      todoRepository.createAndSave.mockResolvedValue(
        buildTodo({ todoId: '4c19f5d4-8a7e-40aa-c16b-4d5e6f708192' }),
      );
      const useCase = new RepeatTodoTomorrowUseCase(todoRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
      );

      expect(result.todoId).toBe('4c19f5d4-8a7e-40aa-c16b-4d5e6f708192');
    });
  });

  describe('RepeatTodoNextUseCase', () => {
    it('원본 투두가 없으면 TODO_NOT_FOUND를 던진다', async () => {
      todoRepository.findByIdAndUser.mockResolvedValue(null);
      const useCase = new RepeatTodoNextUseCase(todoRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
            ['2026-04-09'],
          ),
        ),
      ).resolves.toBe(TodoErrorCode.TODO_NOT_FOUND);
    });

    it('원본과 같은 날짜가 포함되면 TODO_REPEAT_TARGET_SAME_AS_SOURCE를 던진다', async () => {
      todoRepository.findByIdAndUser.mockResolvedValue(
        buildTodo({ todoDate: '2026-04-08' }),
      );
      const useCase = new RepeatTodoNextUseCase(todoRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
            ['2026-04-08', '2026-04-09'],
          ),
        ),
      ).resolves.toBe(TodoErrorCode.TODO_REPEAT_TARGET_SAME_AS_SOURCE);
    });

    it('여러 날짜로 투두를 복제한다', async () => {
      todoRepository.findByIdAndUser.mockResolvedValue(
        buildTodo({
          todoDate: '2026-04-08',
          ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
        }),
      );
      todoRepository.isCategoryOwnedByUser.mockResolvedValue(true);
      todoRepository.createAndSaveMany.mockResolvedValue([
        buildTodo({
          todoId: '4c19f5d4-8a7e-40aa-c16b-4d5e6f708192',
          todoDate: '2026-04-09',
        }),
        buildTodo({
          todoId: '5d2a06e5-9b8f-41bb-d27c-5e6f708192a3',
          todoDate: '2026-04-10',
        }),
      ]);
      const useCase = new RepeatTodoNextUseCase(todoRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
        ['2026-04-09', '2026-04-10'],
      );

      expect(result).toHaveLength(2);
      expect(result[0].todoId).toBe('4c19f5d4-8a7e-40aa-c16b-4d5e6f708192');
      expect(result[1].todoId).toBe('5d2a06e5-9b8f-41bb-d27c-5e6f708192a3');
    });

    it('저장소 오류는 TODO_REPEAT_NEXT_FAILED로 변환한다', async () => {
      todoRepository.findByIdAndUser.mockResolvedValue(
        buildTodo({
          todoDate: '2026-04-08',
          ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
        }),
      );
      todoRepository.isCategoryOwnedByUser.mockResolvedValue(true);
      todoRepository.createAndSaveMany.mockRejectedValue(new Error('db error'));
      const useCase = new RepeatTodoNextUseCase(todoRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
            ['2026-04-09', '2026-04-10'],
          ),
        ),
      ).resolves.toBe(TodoErrorCode.TODO_REPEAT_NEXT_FAILED);
    });
  });
});
