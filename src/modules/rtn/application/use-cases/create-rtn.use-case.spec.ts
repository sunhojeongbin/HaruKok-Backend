import { BusinessException } from '../../../../common/exceptions/business.exception';
import { RtnEntity } from '../../entities/rtn.entity';
import { RptType } from '../../enums/rpt-type.enum';
import { RtnErrorCode } from '../../errors/rtn-error-code';
import { RtnRepositoryPort } from '../ports/rtn.repository.port';
import { CreateRtnUseCase } from './create-rtn.use-case';

function buildRoutineEntity(overrides: Partial<RtnEntity> = {}): RtnEntity {
  const now = new Date('2026-04-08T00:00:00.000Z');
  return {
    rtnId: '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
    usrId: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
    ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
    rtnContent: '헬스장 가기',
    rptTypeCd: RptType.WEEKLY,
    startDt: '2026-04-01',
    endDt: '2026-04-07',
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

describe('CreateRtnUseCase', () => {
  let rtnRepository: jest.Mocked<RtnRepositoryPort>;
  let useCase: CreateRtnUseCase;

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
    useCase = new CreateRtnUseCase(rtnRepository);
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

  it('루틴을 생성하고 반복 조건으로 todoDates를 계산한다', async () => {
    rtnRepository.isCategoryOwnedByUser.mockResolvedValue(true);
    rtnRepository.createWithTodos.mockResolvedValue({
      rtn: buildRoutineEntity({
        rtnRpts: [
          {
            rtnRptId: '8a5d39b8-ceb2-44ee-a5af-8192a3b4c5d6',
            rtnId: '6e3b17f6-ac90-42cc-e38d-6f708192a3b4',
            rptTypeCd: RptType.WEEKLY,
            dayOfWeek: 1,
            dayOfMth: null,
            isDeleted: false,
            createdAt: new Date('2026-04-08T00:00:00.000Z'),
            updatedAt: new Date('2026-04-08T00:00:00.000Z'),
            rtn: undefined as never,
          },
        ],
      }),
      createdTodoCount: 3,
    });

    const result = await useCase.execute(
      '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
      {
        ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
        rtnContent: '  헬스장 가기  ',
        startDt: '2026-04-01',
        endDt: '2026-04-07',
        rptTypeCd: RptType.WEEKLY,
        dayOfWeeks: [1, 3, 5],
        alarmTime: '07:30',
      },
    );

    expect(rtnRepository.createWithTodos.mock.calls).toEqual([
      [
        expect.objectContaining({
          usrId: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
          ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
          rtnContent: '헬스장 가기',
          dayOfWeeks: [1, 3, 5],
          dayOfMths: [],
          todoDates: ['2026-04-01', '2026-04-03', '2026-04-06'],
        }),
      ],
    ]);
    expect(result.createdTodoCount).toBe(3);
  });

  it('카테고리가 본인 소유가 아니면 예외를 던진다', async () => {
    rtnRepository.isCategoryOwnedByUser.mockResolvedValue(false);

    await expect(
      resolveErrorCode(() =>
        useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', {
          ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
          rtnContent: '헬스장 가기',
          startDt: '2026-04-01',
          endDt: '2026-04-07',
          rptTypeCd: RptType.DAILY,
        }),
      ),
    ).resolves.toBe(RtnErrorCode.ROUTINE_CATEGORY_NOT_FOUND);
  });

  it('WEEKLY 반복에서 요일이 없으면 예외를 던진다', async () => {
    await expect(
      resolveErrorCode(() =>
        useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', {
          ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
          rtnContent: '헬스장 가기',
          startDt: '2026-04-01',
          endDt: '2026-04-07',
          rptTypeCd: RptType.WEEKLY,
          dayOfWeeks: [],
        }),
      ),
    ).resolves.toBe(RtnErrorCode.ROUTINE_REPEAT_DAYS_REQUIRED);
  });

  it('반복 조건에 맞는 투두 날짜가 없으면 예외를 던진다', async () => {
    await expect(
      resolveErrorCode(() =>
        useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', {
          ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
          rtnContent: '월말 점검',
          startDt: '2026-04-01',
          endDt: '2026-04-30',
          rptTypeCd: RptType.MONTHLY,
          dayOfMths: [31],
        }),
      ),
    ).resolves.toBe(RtnErrorCode.ROUTINE_TODO_DATES_EMPTY);
  });
});
