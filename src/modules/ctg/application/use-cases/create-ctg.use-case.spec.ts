import { BusinessException } from '../../../../common/exceptions/business.exception';
import { CtgEntity } from '../../entities/ctg.entity';
import { VisibilityType } from '../../enums/visibility-type.enum';
import { CtgErrorCode } from '../../errors/ctg-error-code';
import { CtgRepositoryPort } from '../ports/ctg.repository.port';
import { CreateCtgUseCase } from './create-ctg.use-case';

function buildCategoryEntity(overrides: Partial<CtgEntity> = {}): CtgEntity {
  const now = new Date('2026-04-08T00:00:00.000Z');
  return {
    ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
    usrId: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
    ctgName: '운동',
    visibility: VisibilityType.FRIENDS,
    colorCode: '#000000',
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
    deletedAt: null,
    isEnded: false,
    endedAt: null,
    usr: undefined as never,
    ...overrides,
  };
}

describe('CreateCtgUseCase', () => {
  let ctgRepository: jest.Mocked<CtgRepositoryPort>;
  let useCase: CreateCtgUseCase;

  beforeEach(() => {
    ctgRepository = {
      findByUserAndName: jest.fn(),
      findByIdAndUser: jest.fn(),
      findAllByUser: jest.fn(),
      createWithUserLimit: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
    };
    useCase = new CreateCtgUseCase(ctgRepository);
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

  it('카테고리를 생성하고 기본값을 적용한다', async () => {
    ctgRepository.findByUserAndName.mockResolvedValue(null);
    ctgRepository.createWithUserLimit.mockResolvedValue(
      buildCategoryEntity({
        ctgName: '운동',
      }),
    );

    const result = await useCase.execute(
      '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
      {
        ctgName: '  운동  ',
      },
    );

    expect(ctgRepository.createWithUserLimit.mock.calls).toEqual([
      [
        {
          usrId: '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
          ctgName: '운동',
          visibility: VisibilityType.FRIENDS,
          colorCode: '#000000',
        },
        10,
      ],
    ]);
    expect(result.ctgName).toBe('운동');
    expect(result.visibility).toBe(VisibilityType.FRIENDS);
  });

  it('중복 이름이면 예외를 던진다', async () => {
    ctgRepository.findByUserAndName.mockResolvedValue(buildCategoryEntity());

    await expect(
      resolveErrorCode(() =>
        useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', {
          ctgName: '운동',
        }),
      ),
    ).resolves.toBe(CtgErrorCode.CATEGORY_NAME_DUPLICATED);
  });

  it('생성 가능한 최대 개수를 초과하면 예외를 던진다', async () => {
    ctgRepository.findByUserAndName.mockResolvedValue(null);
    ctgRepository.createWithUserLimit.mockResolvedValue(null);

    await expect(
      resolveErrorCode(() =>
        useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', {
          ctgName: '운동',
        }),
      ),
    ).resolves.toBe(CtgErrorCode.CATEGORY_LIMIT_EXCEEDED);
  });

  it('이름이 비어 있으면 예외를 던진다', async () => {
    await expect(
      useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', {
        ctgName: '   ',
      }),
    ).rejects.toThrow(BusinessException);
    await expect(
      resolveErrorCode(() =>
        useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', {
          ctgName: '   ',
        }),
      ),
    ).resolves.toBe(CtgErrorCode.CATEGORY_NAME_INVALID);
  });
});
