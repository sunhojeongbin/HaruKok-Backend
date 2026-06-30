import { BusinessException } from '../../../../common/exceptions/business.exception';
import { NtfErrorCode } from '../../errors/ntf-error-code';
import { NtfTokenRepositoryPort } from '../ports/ntf-token.repository.port';
import { RemoveNtfTokenUseCase } from './remove-ntf-token.use-case';

const USER_ID = '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90';
const FCM_TOKEN = 'fcm-token-abc123';

describe('RemoveNtfTokenUseCase', () => {
  let ntfTokenRepository: jest.Mocked<NtfTokenRepositoryPort>;
  let useCase: RemoveNtfTokenUseCase;

  beforeEach(() => {
    ntfTokenRepository = {
      isReady: jest.fn().mockReturnValue(true),
      upsertToken: jest.fn(),
      removeByUsrAndToken: jest.fn(),
      findAllActiveTokens: jest.fn(),
      deactivateTokens: jest.fn(),
    };
    useCase = new RemoveNtfTokenUseCase(ntfTokenRepository);
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

  it('본인 토큰을 사용자 ID와 함께 삭제한다', async () => {
    ntfTokenRepository.removeByUsrAndToken.mockResolvedValue(true);

    await useCase.execute(USER_ID, { fcmToken: `  ${FCM_TOKEN}  ` });

    expect(ntfTokenRepository.removeByUsrAndToken.mock.calls).toEqual([
      [USER_ID, FCM_TOKEN],
    ]);
  });

  it('삭제 대상이 없으면 NTF_TOKEN_NOT_FOUND를 던진다', async () => {
    ntfTokenRepository.removeByUsrAndToken.mockResolvedValue(false);

    await expect(
      resolveErrorCode(() => useCase.execute(USER_ID, { fcmToken: FCM_TOKEN })),
    ).resolves.toBe(NtfErrorCode.NTF_TOKEN_NOT_FOUND);
  });

  it('다른 사용자의 토큰은 삭제되지 않아 NTF_TOKEN_NOT_FOUND를 던진다', async () => {
    // 저장소가 usr_id로 필터링하므로 타 사용자 토큰은 affected=0(false)으로 반환된다.
    ntfTokenRepository.removeByUsrAndToken.mockResolvedValue(false);

    await expect(
      resolveErrorCode(() =>
        useCase.execute('00000000-0000-0000-0000-000000000000', {
          fcmToken: FCM_TOKEN,
        }),
      ),
    ).resolves.toBe(NtfErrorCode.NTF_TOKEN_NOT_FOUND);
  });

  it('저장소 예외를 NTF_TOKEN_REMOVE_FAILED로 변환한다', async () => {
    ntfTokenRepository.removeByUsrAndToken.mockRejectedValue(
      new Error('db error'),
    );

    await expect(
      resolveErrorCode(() => useCase.execute(USER_ID, { fcmToken: FCM_TOKEN })),
    ).resolves.toBe(NtfErrorCode.NTF_TOKEN_REMOVE_FAILED);
  });
});
