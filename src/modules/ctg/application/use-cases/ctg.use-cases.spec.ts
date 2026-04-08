import { BusinessException } from '../../../../common/exceptions/business.exception';
import { CtgEntity } from '../../entities/ctg.entity';
import { VisibilityType } from '../../enums/visibility-type.enum';
import { CtgErrorCode } from '../../errors/ctg-error-code';
import { CtgCascadeRepositoryPort } from '../ports/ctg-cascade.repository.port';
import { CtgRepositoryPort } from '../ports/ctg.repository.port';
import { DeleteCtgUseCase } from './delete-ctg.use-case';
import { GetCtgByIdUseCase } from './get-ctg-by-id.use-case';
import { GetCtgListUseCase } from './get-ctg-list.use-case';
import { ReorderCtgUseCase } from './reorder-ctg.use-case';
import { UpdateCtgUseCase } from './update-ctg.use-case';

function buildCategory(overrides: Partial<CtgEntity> = {}): CtgEntity {
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

describe('Ctg UseCases', () => {
  let ctgRepository: jest.Mocked<CtgRepositoryPort>;
  let ctgCascadeRepository: jest.Mocked<CtgCascadeRepositoryPort>;

  beforeEach(() => {
    ctgRepository = {
      findByUserAndName: jest.fn(),
      findByIdAndUser: jest.fn(),
      findAllByUser: jest.fn(),
      createWithUserLimit: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
    };

    ctgCascadeRepository = {
      softDeleteAndReindex: jest.fn(),
    };
  });

  describe('GetCtgByIdUseCase', () => {
    it('카테고리를 조회해 응답으로 반환한다', async () => {
      ctgRepository.findByIdAndUser.mockResolvedValue(buildCategory());
      const useCase = new GetCtgByIdUseCase(ctgRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
      );

      expect(result.ctgId).toBe('19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f');
      expect(result.ctgName).toBe('운동');
    });

    it('카테고리가 없으면 CATEGORY_NOT_FOUND를 던진다', async () => {
      ctgRepository.findByIdAndUser.mockResolvedValue(null);
      const useCase = new GetCtgByIdUseCase(ctgRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
          ),
        ),
      ).resolves.toBe(CtgErrorCode.CATEGORY_NOT_FOUND);
    });
  });

  describe('GetCtgListUseCase', () => {
    it('카테고리 목록을 매핑해 반환한다', async () => {
      ctgRepository.findAllByUser.mockResolvedValue([
        buildCategory({
          ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
          ctgName: '운동',
        }),
        buildCategory({
          ctgId: '2af7d3b2-6e5c-4e88-af4f-2b3c4d5e6f70',
          ctgName: '공부',
          sortOrder: 1,
        }),
      ]);
      const useCase = new GetCtgListUseCase(ctgRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
      );

      expect(result).toHaveLength(2);
      expect(result[0].ctgName).toBe('운동');
      expect(result[1].ctgName).toBe('공부');
    });
  });

  describe('UpdateCtgUseCase', () => {
    it('카테고리가 없으면 CATEGORY_NOT_FOUND를 던진다', async () => {
      ctgRepository.findByIdAndUser.mockResolvedValue(null);
      const useCase = new UpdateCtgUseCase(ctgRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
            { ctgName: '새이름' },
          ),
        ),
      ).resolves.toBe(CtgErrorCode.CATEGORY_NOT_FOUND);
    });

    it('이름이 유효하지 않으면 CATEGORY_NAME_INVALID를 던진다', async () => {
      ctgRepository.findByIdAndUser.mockResolvedValue(buildCategory());
      const useCase = new UpdateCtgUseCase(ctgRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
            { ctgName: '          ' },
          ),
        ),
      ).resolves.toBe(CtgErrorCode.CATEGORY_NAME_INVALID);
    });

    it('이름이 중복이면 CATEGORY_NAME_DUPLICATED를 던진다', async () => {
      ctgRepository.findByIdAndUser.mockResolvedValue(buildCategory());
      ctgRepository.findByUserAndName.mockResolvedValue(
        buildCategory({
          ctgId: '2af7d3b2-6e5c-4e88-af4f-2b3c4d5e6f70',
          ctgName: '독서',
        }),
      );
      const useCase = new UpdateCtgUseCase(ctgRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
            { ctgName: '독서' },
          ),
        ),
      ).resolves.toBe(CtgErrorCode.CATEGORY_NAME_DUPLICATED);
    });

    it('종료 상태 업데이트 시 endedAt을 설정하고 저장한다', async () => {
      const category = buildCategory();
      ctgRepository.findByIdAndUser.mockResolvedValue(category);
      ctgRepository.save.mockImplementation((value) => Promise.resolve(value));
      const useCase = new UpdateCtgUseCase(ctgRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
        {
          isEnded: true,
        },
      );

      expect(result.isEnded).toBe(true);
      expect(result.endedAt).not.toBeNull();
      expect(ctgRepository.save.mock.calls).toHaveLength(1);
    });

    it('저장 실패는 CATEGORY_UPDATE_FAILED로 변환한다', async () => {
      ctgRepository.findByIdAndUser.mockResolvedValue(buildCategory());
      ctgRepository.save.mockRejectedValue(new Error('db error'));
      const useCase = new UpdateCtgUseCase(ctgRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
            { colorCode: '#FFFFFF' },
          ),
        ),
      ).resolves.toBe(CtgErrorCode.CATEGORY_UPDATE_FAILED);
    });
  });

  describe('DeleteCtgUseCase', () => {
    it('카테고리가 없으면 CATEGORY_NOT_FOUND를 던진다', async () => {
      ctgRepository.findByIdAndUser.mockResolvedValue(null);
      const useCase = new DeleteCtgUseCase(ctgRepository, ctgCascadeRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
          ),
        ),
      ).resolves.toBe(CtgErrorCode.CATEGORY_NOT_FOUND);
    });

    it('cascade에서 BusinessException이 오면 그대로 전달한다', async () => {
      ctgRepository.findByIdAndUser.mockResolvedValue(buildCategory());
      ctgCascadeRepository.softDeleteAndReindex.mockRejectedValue(
        new BusinessException(CtgErrorCode.CATEGORY_REPOSITORY_NOT_READY),
      );
      const useCase = new DeleteCtgUseCase(ctgRepository, ctgCascadeRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
          ),
        ),
      ).resolves.toBe(CtgErrorCode.CATEGORY_REPOSITORY_NOT_READY);
    });

    it('cascade 알 수 없는 오류는 CATEGORY_DELETE_FAILED로 변환한다', async () => {
      ctgRepository.findByIdAndUser.mockResolvedValue(buildCategory());
      ctgCascadeRepository.softDeleteAndReindex.mockRejectedValue(
        new Error('unknown'),
      );
      const useCase = new DeleteCtgUseCase(ctgRepository, ctgCascadeRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute(
            '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
            '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
          ),
        ),
      ).resolves.toBe(CtgErrorCode.CATEGORY_DELETE_FAILED);
    });

    it('정상 삭제면 ctgId를 반환한다', async () => {
      ctgRepository.findByIdAndUser.mockResolvedValue(buildCategory());
      ctgCascadeRepository.softDeleteAndReindex.mockResolvedValue(undefined);
      const useCase = new DeleteCtgUseCase(ctgRepository, ctgCascadeRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
      );

      expect(result).toEqual({ ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f' });
    });
  });

  describe('ReorderCtgUseCase', () => {
    it('요청 개수가 다르면 CATEGORY_ORDER_INVALID를 던진다', async () => {
      ctgRepository.findAllByUser.mockResolvedValue([
        buildCategory({ ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f' }),
        buildCategory({
          ctgId: '2af7d3b2-6e5c-4e88-af4f-2b3c4d5e6f70',
          sortOrder: 1,
        }),
      ]);
      const useCase = new ReorderCtgUseCase(ctgRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', [
            '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
          ]),
        ),
      ).resolves.toBe(CtgErrorCode.CATEGORY_ORDER_INVALID);
    });

    it('중복 ID가 있으면 CATEGORY_ORDER_INVALID를 던진다', async () => {
      ctgRepository.findAllByUser.mockResolvedValue([
        buildCategory({ ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f' }),
        buildCategory({
          ctgId: '2af7d3b2-6e5c-4e88-af4f-2b3c4d5e6f70',
          sortOrder: 1,
        }),
      ]);
      const useCase = new ReorderCtgUseCase(ctgRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', [
            '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
            '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
          ]),
        ),
      ).resolves.toBe(CtgErrorCode.CATEGORY_ORDER_INVALID);
    });

    it('정렬 저장 실패는 CATEGORY_ORDER_UPDATE_FAILED로 변환한다', async () => {
      ctgRepository.findAllByUser.mockResolvedValue([
        buildCategory({ ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f' }),
        buildCategory({
          ctgId: '2af7d3b2-6e5c-4e88-af4f-2b3c4d5e6f70',
          sortOrder: 1,
        }),
      ]);
      ctgRepository.saveMany.mockRejectedValue(new Error('db error'));
      const useCase = new ReorderCtgUseCase(ctgRepository);

      await expect(
        resolveErrorCode(() =>
          useCase.execute('7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90', [
            '2af7d3b2-6e5c-4e88-af4f-2b3c4d5e6f70',
            '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
          ]),
        ),
      ).resolves.toBe(CtgErrorCode.CATEGORY_ORDER_UPDATE_FAILED);
    });

    it('정렬 변경 성공 시 sortOrder를 재할당한다', async () => {
      const first = buildCategory({
        ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
        sortOrder: 0,
      });
      const second = buildCategory({
        ctgId: '2af7d3b2-6e5c-4e88-af4f-2b3c4d5e6f70',
        sortOrder: 1,
      });
      ctgRepository.findAllByUser.mockResolvedValue([first, second]);
      ctgRepository.saveMany.mockImplementation((items) =>
        Promise.resolve(items),
      );
      const useCase = new ReorderCtgUseCase(ctgRepository);

      const result = await useCase.execute(
        '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90',
        [
          '2af7d3b2-6e5c-4e88-af4f-2b3c4d5e6f70',
          '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
        ],
      );

      expect(result).toEqual([
        expect.objectContaining({
          ctgId: '2af7d3b2-6e5c-4e88-af4f-2b3c4d5e6f70',
          sortOrder: 0,
        }),
        expect.objectContaining({
          ctgId: '19f6c2a1-5d4b-4d77-9f3e-1a2b3c4d5e6f',
          sortOrder: 1,
        }),
      ]);
    });
  });
});
