import { BusinessException } from '../../../../common/exceptions/business.exception';
import { RtnEntity } from '../../entities/rtn.entity';
import { RptType } from '../../enums/rpt-type.enum';
import { RtnErrorCode } from '../../errors/rtn-error-code';
import { RtnRepositoryPort } from '../ports/rtn.repository.port';
import { DeleteRtnUseCase } from './delete-rtn.use-case';
import { GetRtnByIdUseCase } from './get-rtn-by-id.use-case';
import { GetRtnListUseCase } from './get-rtn-list.use-case';
import { ReorderRtnUseCase } from './reorder-rtn.use-case';
import { UpdateRtnUseCase } from './update-rtn.use-case';

function buildRoutine(overrides: Partial<RtnEntity> = {}): RtnEntity {
  const now = new Date('2026-04-08T00:00:00.000Z');
  return {
    rtnId: '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
    usrId: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
    ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
    rtnContent: '헬스장 가기',
    rptTypeCd: RptType.DAILY,
    startDt: '2026-04-01',
    endDt: '2026-04-30',
    alarmTime: '07:30',
    sortOrder: 0,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    usr: undefined as never,
    ctg: undefined as never,
    rtnRpts: [],
    todos: [],
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

describe('Rtn UseCases', () => {
  let rtnRepository: jest.Mocked<RtnRepositoryPort>;

  beforeEach(() => {
    rtnRepository = {
      isCategoryOwnedByUser: jest.fn(),
      findByIdAndUser: jest.fn(),
      createWithTodos: jest.fn(),
      updateFromToday: jest.fn(),
      deleteFromToday: jest.fn(),
      findAllByUserAndCategory: jest.fn(),
      saveMany: jest.fn(),
      findAllByUser: jest.fn(),
    };
  });

  describe('GetRtnByIdUseCase', () => {
    it('루틴 상세를 조회한다', async () => {
      rtnRepository.findByIdAndUser.mockResolvedValue(buildRoutine());
      const useCase = new GetRtnByIdUseCase(rtnRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
      );

      expect(result.rtnId).toBe('6e3b17f6-ac90-42cc-e38d-6f708192a3b4');
      expect(result.rtnContent).toBe('헬스장 가기');
    });

    it('루틴이 없으면 ROUTINE_NOT_FOUND를 던진다', async () => {
      rtnRepository.findByIdAndUser.mockResolvedValue(null);
      const useCase = new GetRtnByIdUseCase(rtnRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
          ),
        ),
      ).resolves.toBe(RtnErrorCode.ROUTINE_NOT_FOUND);
    });

    it('저장소 오류는 ROUTINE_GET_FAILED로 변환한다', async () => {
      rtnRepository.findByIdAndUser.mockRejectedValue(new Error('db error'));
      const useCase = new GetRtnByIdUseCase(rtnRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
          ),
        ),
      ).resolves.toBe(RtnErrorCode.ROUTINE_GET_FAILED);
    });
  });

  describe('GetRtnListUseCase', () => {
    it('루틴 목록을 조회한다', async () => {
      rtnRepository.findAllByUser.mockResolvedValue([
        buildRoutine({ rtnId: '6e3b17f6-ac90-42cc-e38d-6f708192a3b4' }),
        buildRoutine({
          rtnId: '7f4c28a7-bda1-43dd-f49e-708192a3b4c5',
          sortOrder: 1,
        }),
      ]);
      const useCase = new GetRtnListUseCase(rtnRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
      );

      expect(result).toHaveLength(2);
      expect(result[0]!.rtnId).toBe('6e3b17f6-ac90-42cc-e38d-6f708192a3b4');
      expect(result[1]!.rtnId).toBe('7f4c28a7-bda1-43dd-f49e-708192a3b4c5');
    });

    it('저장소 오류는 ROUTINE_LIST_FAILED로 변환한다', async () => {
      rtnRepository.findAllByUser.mockRejectedValue(new Error('db error'));
      const useCase = new GetRtnListUseCase(rtnRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90'),
        ),
      ).resolves.toBe(RtnErrorCode.ROUTINE_LIST_FAILED);
    });
  });

  describe('UpdateRtnUseCase', () => {
    it('수정 payload가 비어 있으면 ROUTINE_UPDATE_PAYLOAD_EMPTY를 던진다', async () => {
      const useCase = new UpdateRtnUseCase(rtnRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
            {},
          ),
        ),
      ).resolves.toBe(RtnErrorCode.ROUTINE_UPDATE_PAYLOAD_EMPTY);
    });

    it('루틴이 없으면 ROUTINE_NOT_FOUND를 던진다', async () => {
      rtnRepository.findByIdAndUser.mockResolvedValue(null);
      const useCase = new UpdateRtnUseCase(rtnRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
            { rtnContent: '새 루틴' },
          ),
        ),
      ).resolves.toBe(RtnErrorCode.ROUTINE_NOT_FOUND);
    });

    it('카테고리가 본인 소유가 아니면 ROUTINE_CATEGORY_NOT_FOUND를 던진다', async () => {
      rtnRepository.findByIdAndUser.mockResolvedValue(buildRoutine());
      rtnRepository.isCategoryOwnedByUser.mockResolvedValue(false);
      const useCase = new UpdateRtnUseCase(rtnRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
            {
              ctgId: '2af7d3b2-6e5c-4e88-af4f-2b3c4d5e6f70',
              rtnContent: '새 루틴',
            },
          ),
        ),
      ).resolves.toBe(RtnErrorCode.ROUTINE_CATEGORY_NOT_FOUND);
    });

    it('루틴 조회 저장소 오류도 ROUTINE_UPDATE_FAILED로 변환한다', async () => {
      rtnRepository.findByIdAndUser.mockRejectedValue(new Error('db error'));
      const useCase = new UpdateRtnUseCase(rtnRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
            { rtnContent: '새 루틴' },
          ),
        ),
      ).resolves.toBe(RtnErrorCode.ROUTINE_UPDATE_FAILED);
    });

    it('수정 성공 시 updateFromToday를 호출하고 결과를 반환한다', async () => {
      rtnRepository.findByIdAndUser.mockResolvedValue(buildRoutine());
      rtnRepository.isCategoryOwnedByUser.mockResolvedValue(true);
      rtnRepository.updateFromToday.mockResolvedValue(
        buildRoutine({
          rtnContent: '루틴 변경',
          ctgId: '2af7d3b2-6e5c-4e88-af4f-2b3c4d5e6f70',
        }),
      );
      const useCase = new UpdateRtnUseCase(rtnRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
        {
          ctgId: '2af7d3b2-6e5c-4e88-af4f-2b3c4d5e6f70',
          rtnContent: '  루틴 변경  ',
          rptTypeCd: RptType.DAILY,
          startDt: '2999-01-01',
          endDt: '2999-01-03',
        },
      );

      expect(result).toEqual(
        expect.objectContaining({
          rtnId: '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
          rtnContent: '루틴 변경',
          ctgId: '2af7d3b2-6e5c-4e88-af4f-2b3c4d5e6f70',
        }),
      );
      expect(rtnRepository.updateFromToday.mock.calls).toHaveLength(1);
      expect(rtnRepository.updateFromToday.mock.calls[0]![0]).toEqual(
        expect.objectContaining({
          usrId: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
          rtnId: '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
          ctgId: '2af7d3b2-6e5c-4e88-af4f-2b3c4d5e6f70',
          todoDatesFromToday: ['2999-01-01', '2999-01-02', '2999-01-03'],
        }),
      );
    });

    it('저장소 오류는 ROUTINE_UPDATE_FAILED로 변환한다', async () => {
      rtnRepository.findByIdAndUser.mockResolvedValue(buildRoutine());
      rtnRepository.updateFromToday.mockRejectedValue(new Error('db error'));
      const useCase = new UpdateRtnUseCase(rtnRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
            {
              rtnContent: '변경',
              rptTypeCd: RptType.DAILY,
            },
          ),
        ),
      ).resolves.toBe(RtnErrorCode.ROUTINE_UPDATE_FAILED);
    });
  });

  describe('DeleteRtnUseCase', () => {
    it('루틴이 없으면 ROUTINE_NOT_FOUND를 던진다', async () => {
      rtnRepository.findByIdAndUser.mockResolvedValue(null);
      const useCase = new DeleteRtnUseCase(rtnRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
          ),
        ),
      ).resolves.toBe(RtnErrorCode.ROUTINE_NOT_FOUND);
    });

    it('삭제 결과가 false면 ROUTINE_NOT_FOUND를 던진다', async () => {
      rtnRepository.findByIdAndUser.mockResolvedValue(buildRoutine());
      rtnRepository.deleteFromToday.mockResolvedValue(false);
      const useCase = new DeleteRtnUseCase(rtnRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
          ),
        ),
      ).resolves.toBe(RtnErrorCode.ROUTINE_NOT_FOUND);
    });

    it('정상 삭제면 rtnId를 반환한다', async () => {
      rtnRepository.findByIdAndUser.mockResolvedValue(buildRoutine());
      rtnRepository.deleteFromToday.mockResolvedValue(true);
      const useCase = new DeleteRtnUseCase(rtnRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
      );

      expect(result).toEqual({ rtnId: '6e3b17f6-ac90-42cc-e38d-6f708192a3b4' });
    });

    it('저장소 오류는 ROUTINE_DELETE_FAILED로 변환한다', async () => {
      rtnRepository.findByIdAndUser.mockResolvedValue(buildRoutine());
      rtnRepository.deleteFromToday.mockRejectedValue(new Error('db error'));
      const useCase = new DeleteRtnUseCase(rtnRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
          ),
        ),
      ).resolves.toBe(RtnErrorCode.ROUTINE_DELETE_FAILED);
    });
  });

  describe('ReorderRtnUseCase', () => {
    it('요청 개수가 다르면 ROUTINE_ORDER_INVALID를 던진다', async () => {
      rtnRepository.isCategoryOwnedByUser.mockResolvedValue(true);
      rtnRepository.findAllByUserAndCategory.mockResolvedValue([
        buildRoutine({ rtnId: '6e3b17f6-ac90-42cc-e38d-6f708192a3b4' }),
        buildRoutine({
          rtnId: '7f4c28a7-bda1-43dd-f49e-708192a3b4c5',
          sortOrder: 1,
        }),
      ]);
      const useCase = new ReorderRtnUseCase(rtnRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', {
            ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
            rtnIds: ['6e3b17f6-ac90-42cc-e38d-6f708192a3b4'],
          }),
        ),
      ).resolves.toBe(RtnErrorCode.ROUTINE_ORDER_INVALID);
    });

    it('정렬 저장 실패는 ROUTINE_ORDER_UPDATE_FAILED로 변환한다', async () => {
      rtnRepository.isCategoryOwnedByUser.mockResolvedValue(true);
      rtnRepository.findAllByUserAndCategory.mockResolvedValue([
        buildRoutine({ rtnId: '6e3b17f6-ac90-42cc-e38d-6f708192a3b4' }),
        buildRoutine({
          rtnId: '7f4c28a7-bda1-43dd-f49e-708192a3b4c5',
          sortOrder: 1,
        }),
      ]);
      rtnRepository.saveMany.mockRejectedValue(new Error('db error'));
      const useCase = new ReorderRtnUseCase(rtnRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', {
            ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
            rtnIds: [
              '7f4c28a7-bda1-43dd-f49e-708192a3b4c5',
              '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
            ],
          }),
        ),
      ).resolves.toBe(RtnErrorCode.ROUTINE_ORDER_UPDATE_FAILED);
    });

    it('정렬 변경 성공 시 sortOrder를 반환한다', async () => {
      rtnRepository.isCategoryOwnedByUser.mockResolvedValue(true);
      rtnRepository.findAllByUserAndCategory.mockResolvedValue([
        buildRoutine({
          rtnId: '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
          sortOrder: 0,
        }),
        buildRoutine({
          rtnId: '7f4c28a7-bda1-43dd-f49e-708192a3b4c5',
          sortOrder: 1,
        }),
      ]);
      rtnRepository.saveMany.mockImplementation((items) =>
        Promise.resolve(items),
      );
      const useCase = new ReorderRtnUseCase(rtnRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        {
          ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
          rtnIds: [
            '7f4c28a7-bda1-43dd-f49e-708192a3b4c5',
            '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
          ],
        },
      );

      expect(result).toEqual([
        { rtnId: '7f4c28a7-bda1-43dd-f49e-708192a3b4c5', sortOrder: 0 },
        { rtnId: '6e3b17f6-ac90-42cc-e38d-6f708192a3b4', sortOrder: 1 },
      ]);
    });
  });
});
