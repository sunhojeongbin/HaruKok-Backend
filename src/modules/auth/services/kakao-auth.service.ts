import { Injectable } from '@nestjs/common';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { AuthErrorCode } from '../errors/auth-error-code';

/** @description 카카오 액세스 토큰 검증 결과 */
export type KakaoUserProfile = {
  providerUid: string;
  email: string | null;
  name: string;
};

/** @description access_token_info 응답 형태 */
type KakaoAccessTokenInfo = {
  id?: number;
  app_id?: number;
};

/** @description v2/user/me 응답 형태 */
type KakaoUserMe = {
  id?: number;
  kakao_account?: {
    email?: string;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    profile?: {
      nickname?: string;
    };
  };
};

const ACCESS_TOKEN_INFO_URL =
  'https://kapi.kakao.com/v1/user/access_token_info';
const USER_ME_URL = 'https://kapi.kakao.com/v2/user/me';
const DEFAULT_KAKAO_NICKNAME = '카카오사용자';

/** @description 카카오 액세스 토큰을 검증해 사용자 프로필을 반환하는 서비스 */
@Injectable()
export class KakaoAuthService {
  /** @description KAKAO_APP_ID 를 조회한다. 미설정 시 AUTH_CONFIG_INVALID. */
  private getAppId(): string {
    const appId = process.env.KAKAO_APP_ID?.trim();
    if (!appId) {
      throw new BusinessException(AuthErrorCode.AUTH_CONFIG_INVALID);
    }
    return appId;
  }

  /** @description Bearer 인증으로 카카오 API를 호출하고 JSON을 반환한다. */
  private async fetchKakao<T>(url: string, accessToken: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      throw new BusinessException(AuthErrorCode.KAKAO_TOKEN_INVALID);
    }

    if (!response.ok) {
      throw new BusinessException(AuthErrorCode.KAKAO_TOKEN_INVALID);
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new BusinessException(AuthErrorCode.KAKAO_TOKEN_INVALID);
    }
  }

  /** @description 카카오 액세스 토큰을 검증하고 사용자 프로필을 반환한다. */
  async verify(accessToken: string): Promise<KakaoUserProfile> {
    const appId = this.getAppId();

    // 1) 토큰이 우리 앱에서 발급됐는지 검증 (app_id 대조)
    const tokenInfo = await this.fetchKakao<KakaoAccessTokenInfo>(
      ACCESS_TOKEN_INFO_URL,
      accessToken,
    );
    if (tokenInfo.app_id === undefined || String(tokenInfo.app_id) !== appId) {
      throw new BusinessException(AuthErrorCode.KAKAO_TOKEN_INVALID);
    }

    // 2) 사용자 정보 조회
    const me = await this.fetchKakao<KakaoUserMe>(USER_ME_URL, accessToken);
    if (me.id === undefined) {
      throw new BusinessException(AuthErrorCode.KAKAO_TOKEN_INVALID);
    }

    const account = me.kakao_account;
    const emailUsable = Boolean(
      account?.is_email_valid && account?.is_email_verified && account?.email,
    );

    return {
      providerUid: String(me.id),
      email: emailUsable ? (account?.email ?? null) : null,
      name: account?.profile?.nickname?.trim() || DEFAULT_KAKAO_NICKNAME,
    };
  }
}
