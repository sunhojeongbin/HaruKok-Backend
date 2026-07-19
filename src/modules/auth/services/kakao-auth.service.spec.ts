import { BusinessException } from '../../../common/exceptions/business.exception';
import { AuthErrorCode } from '../errors/auth-error-code';
import { KakaoAuthService } from './kakao-auth.service';

type JsonBody = Record<string, unknown>;

/** @description ok/JSON 본문을 갖는 fetch Response 스텁을 만든다. */
function mockResponse(ok: boolean, body: JsonBody): Response {
  return {
    ok,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

const APP_ID = '111111';

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

describe('KakaoAuthService', () => {
  const ACCESS_TOKEN = 'kakao-access-token';
  let service: KakaoAuthService;
  let fetchMock: jest.Mock;
  const originalFetch = global.fetch;
  const originalAppId = process.env.KAKAO_APP_ID;

  beforeEach(() => {
    service = new KakaoAuthService();
    process.env.KAKAO_APP_ID = APP_ID;
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.KAKAO_APP_ID = originalAppId;
  });

  /** @description access_token_info → user/me 순서로 응답을 설정한다. */
  function setKakaoResponses(tokenInfo: JsonBody, userMe: JsonBody): void {
    fetchMock
      .mockResolvedValueOnce(mockResponse(true, tokenInfo))
      .mockResolvedValueOnce(mockResponse(true, userMe));
  }

  it('앱 검증을 통과하고 이메일/닉네임을 반환한다', async () => {
    setKakaoResponses(
      { id: 123, app_id: 111111 },
      {
        id: 123,
        kakao_account: {
          is_email_valid: true,
          is_email_verified: true,
          email: 'user@kakao.com',
          profile: { nickname: '홍길동' },
        },
      },
    );

    const profile = await service.verify(ACCESS_TOKEN);

    expect(profile).toEqual({
      providerUid: '123',
      email: 'user@kakao.com',
      name: '홍길동',
    });
  });

  it('이메일이 인증되지 않았으면 email은 null이다', async () => {
    setKakaoResponses(
      { id: 123, app_id: 111111 },
      {
        id: 123,
        kakao_account: {
          is_email_valid: true,
          is_email_verified: false,
          email: 'user@kakao.com',
          profile: { nickname: '홍길동' },
        },
      },
    );

    const profile = await service.verify(ACCESS_TOKEN);

    expect(profile.email).toBeNull();
  });

  it('닉네임이 없으면 기본값 카카오사용자를 사용한다', async () => {
    setKakaoResponses(
      { id: 123, app_id: 111111 },
      { id: 123, kakao_account: { profile: {} } },
    );

    const profile = await service.verify(ACCESS_TOKEN);

    expect(profile.name).toBe('카카오사용자');
    expect(profile.email).toBeNull();
  });

  it('app_id가 우리 앱과 다르면 KAKAO_TOKEN_INVALID를 던진다', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(true, { id: 123, app_id: 999999 }),
    );

    const code = await resolveErrorCode(() => service.verify(ACCESS_TOKEN));

    expect(code).toBe(AuthErrorCode.KAKAO_TOKEN_INVALID);
    // user/me는 호출되지 않는다
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('카카오 응답이 비200이면 KAKAO_TOKEN_INVALID를 던진다', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(false, {}));

    const code = await resolveErrorCode(() => service.verify(ACCESS_TOKEN));

    expect(code).toBe(AuthErrorCode.KAKAO_TOKEN_INVALID);
  });

  it('KAKAO_APP_ID가 설정되지 않으면 AUTH_CONFIG_INVALID를 던진다', async () => {
    delete process.env.KAKAO_APP_ID;

    const code = await resolveErrorCode(() => service.verify(ACCESS_TOKEN));

    expect(code).toBe(AuthErrorCode.AUTH_CONFIG_INVALID);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
