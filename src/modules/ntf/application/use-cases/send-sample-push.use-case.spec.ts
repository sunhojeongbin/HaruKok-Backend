import { BusinessException } from '../../../../common/exceptions/business.exception';
import { NtfErrorCode } from '../../errors/ntf-error-code';
import { NtfTokenRepositoryPort } from '../ports/ntf-token.repository.port';
import { PushSenderPort } from '../ports/push-sender.port';
import { SendSamplePushUseCase } from './send-sample-push.use-case';

const USER_ID = '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90';
const PAYLOAD = { title: '테스트 제목', body: '테스트 본문' };

describe('SendSamplePushUseCase', () => {
  let ntfTokenRepository: jest.Mocked<NtfTokenRepositoryPort>;
  let pushSender: jest.Mocked<PushSenderPort>;
  let useCase: SendSamplePushUseCase;

  beforeEach(() => {
    ntfTokenRepository = {
      isReady: jest.fn().mockReturnValue(true),
      upsertToken: jest.fn(),
      removeByUsrAndToken: jest.fn(),
      findAllActiveTokens: jest.fn(),
      findActiveTokensByUser: jest.fn(),
      deactivateTokens: jest.fn().mockResolvedValue(undefined),
    };
    pushSender = {
      send: jest.fn(),
    };
    useCase = new SendSamplePushUseCase(ntfTokenRepository, pushSender);
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

  it('내 활성 토큰 전체로 푸시를 발송하고 결과를 반환한다', async () => {
    ntfTokenRepository.findActiveTokensByUser.mockResolvedValue([
      'token-1',
      'token-2',
    ]);
    pushSender.send.mockResolvedValue({ invalidTokens: [] });

    const result = await useCase.execute(USER_ID, PAYLOAD);

    expect(pushSender.send.mock.calls).toEqual([
      [['token-1', 'token-2'], PAYLOAD],
    ]);
    expect(result).toEqual({ requestedTokenCount: 2, invalidTokenCount: 0 });
    expect(ntfTokenRepository.deactivateTokens.mock.calls).toHaveLength(0);
  });

  it('등록된 활성 토큰이 없으면 NTF_TOKEN_NOT_FOUND를 던진다', async () => {
    ntfTokenRepository.findActiveTokensByUser.mockResolvedValue([]);

    await expect(
      resolveErrorCode(() => useCase.execute(USER_ID, PAYLOAD)),
    ).resolves.toBe(NtfErrorCode.NTF_TOKEN_NOT_FOUND);
    expect(pushSender.send.mock.calls).toHaveLength(0);
  });

  it('저장소가 준비되지 않으면 NTF_TOKEN_REPOSITORY_NOT_READY를 던진다', async () => {
    ntfTokenRepository.isReady.mockReturnValue(false);

    await expect(
      resolveErrorCode(() => useCase.execute(USER_ID, PAYLOAD)),
    ).resolves.toBe(NtfErrorCode.NTF_TOKEN_REPOSITORY_NOT_READY);
    expect(ntfTokenRepository.findActiveTokensByUser.mock.calls).toHaveLength(
      0,
    );
  });

  it('발송 중 예외가 나면 PUSH_SEND_FAILED를 던진다', async () => {
    ntfTokenRepository.findActiveTokensByUser.mockResolvedValue(['token-1']);
    pushSender.send.mockRejectedValue(new Error('fcm error'));

    await expect(
      resolveErrorCode(() => useCase.execute(USER_ID, PAYLOAD)),
    ).resolves.toBe(NtfErrorCode.PUSH_SEND_FAILED);
  });

  it('무효 토큰이 반환되면 해당 토큰을 비활성화한다', async () => {
    ntfTokenRepository.findActiveTokensByUser.mockResolvedValue([
      'token-1',
      'token-2',
    ]);
    pushSender.send.mockResolvedValue({ invalidTokens: ['token-2'] });

    const result = await useCase.execute(USER_ID, PAYLOAD);

    expect(ntfTokenRepository.deactivateTokens.mock.calls).toEqual([
      [['token-2']],
    ]);
    expect(result).toEqual({ requestedTokenCount: 2, invalidTokenCount: 1 });
  });
});
