import { BusinessException } from '../../../../common/exceptions/business.exception';
import { AuthResponse } from '../../../../common/response/auth.response';
import { UsrEntity } from '../../../usr/entities/usr.entity';
import { UsrRepositoryPort } from '../../../usr/repositories/usr.repository.port';
import { NtfTokenEntity } from '../../entities/ntf-token.entity';
import { NtfErrorCode } from '../../errors/ntf-error-code';
import { NtfTokenRepositoryPort } from '../ports/ntf-token.repository.port';
import { RegisterNtfTokenUseCase } from './register-ntf-token.use-case';

const USER_ID = '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90';
const FCM_TOKEN = 'fcm-token-abc123';

function buildNtfTokenEntity(
  overrides: Partial<NtfTokenEntity> = {},
): NtfTokenEntity {
  const now = new Date('2026-06-28T00:00:00.000Z');
  return {
    ntfTokenId: '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
    usrId: USER_ID,
    fcmToken: FCM_TOKEN,
    platformCd: 'AOS',
    isActive: true,
    lastUsedAt: now,
    createdAt: now,
    updatedAt: now,
    usr: undefined as never,
    ...overrides,
  };
}

describe('RegisterNtfTokenUseCase', () => {
  let usrRepository: jest.Mocked<UsrRepositoryPort>;
  let ntfTokenRepository: jest.Mocked<NtfTokenRepositoryPort>;
  let useCase: RegisterNtfTokenUseCase;

  beforeEach(() => {
    usrRepository = {
      isReady: jest.fn(),
      findByEmail: jest.fn(),
      findActiveByEmail: jest.fn(),
      findById: jest.fn(),
      findActiveById: jest.fn(),
      countAcceptedFrds: jest.fn(),
      getTodoDashboardMetrics: jest.fn(),
      createAndSave: jest.fn(),
      save: jest.fn(),
      hardDeleteById: jest.fn(),
    };
    ntfTokenRepository = {
      isReady: jest.fn().mockReturnValue(true),
      upsertToken: jest.fn(),
      removeByUsrAndToken: jest.fn(),
      findAllActiveTokens: jest.fn(),
      deactivateTokens: jest.fn(),
    };
    useCase = new RegisterNtfTokenUseCase(usrRepository, ntfTokenRepository);
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

  it('토큰을 정규화하여 저장하고 결과를 반환한다', async () => {
    usrRepository.findActiveById.mockResolvedValue({} as UsrEntity);
    const saved = buildNtfTokenEntity();
    ntfTokenRepository.upsertToken.mockResolvedValue(saved);

    const result = await useCase.execute(USER_ID, {
      fcmToken: `  ${FCM_TOKEN}  `,
      platformCd: 'aos',
    });

    expect(ntfTokenRepository.upsertToken.mock.calls).toEqual([
      [USER_ID, FCM_TOKEN, 'AOS'],
    ]);
    expect(result).toBe(saved);
  });

  it('존재하지 않는 사용자면 USER_NOT_FOUND를 던진다', async () => {
    usrRepository.findActiveById.mockResolvedValue(null);

    await expect(
      resolveErrorCode(() =>
        useCase.execute(USER_ID, { fcmToken: FCM_TOKEN, platformCd: 'AOS' }),
      ),
    ).resolves.toBe(AuthResponse.USER_NOT_FOUND.errorCode);
    expect(ntfTokenRepository.upsertToken.mock.calls).toHaveLength(0);
  });

  it('지원하지 않는 플랫폼이면 NTF_TOKEN_PLATFORM_INVALID를 던진다', async () => {
    await expect(
      resolveErrorCode(() =>
        useCase.execute(USER_ID, {
          fcmToken: FCM_TOKEN,
          platformCd: 'WINDOWS',
        }),
      ),
    ).resolves.toBe(NtfErrorCode.NTF_TOKEN_PLATFORM_INVALID);
    expect(usrRepository.findActiveById.mock.calls).toHaveLength(0);
  });

  it('저장소 예외를 NTF_TOKEN_SAVE_FAILED로 변환한다', async () => {
    usrRepository.findActiveById.mockResolvedValue({} as UsrEntity);
    ntfTokenRepository.upsertToken.mockRejectedValue(new Error('db error'));

    await expect(
      resolveErrorCode(() =>
        useCase.execute(USER_ID, { fcmToken: FCM_TOKEN, platformCd: 'AOS' }),
      ),
    ).resolves.toBe(NtfErrorCode.NTF_TOKEN_SAVE_FAILED);
  });
});
