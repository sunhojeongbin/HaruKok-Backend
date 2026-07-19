import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { AuthErrorCode } from '../errors/auth-error-code';

/** @description 구글 ID 토큰 검증 결과 */
export type GoogleUserProfile = {
  providerUid: string;
  email: string;
  name: string;
};

/** @description 구글 ID 토큰을 검증해 사용자 프로필을 반환하는 서비스 */
@Injectable()
export class GoogleAuthService {
  private client: OAuth2Client | null = null;

  /** @description GOOGLE_CLIENT_ID 를 조회한다. 미설정 시 AUTH_CONFIG_INVALID. */
  private getClientId(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      throw new BusinessException(AuthErrorCode.AUTH_CONFIG_INVALID);
    }
    return clientId;
  }

  private getClient(): OAuth2Client {
    if (!this.client) {
      this.client = new OAuth2Client();
    }
    return this.client;
  }

  /** @description 구글 ID 토큰을 검증하고 사용자 프로필을 반환한다. */
  async verify(idToken: string): Promise<GoogleUserProfile> {
    const clientId = this.getClientId();

    let payload:
      | {
          sub?: string;
          email?: string;
          email_verified?: boolean;
          name?: string;
        }
      | undefined;
    try {
      const ticket = await this.getClient().verifyIdToken({
        idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new BusinessException(AuthErrorCode.GOOGLE_TOKEN_INVALID);
    }

    if (!payload?.sub || !payload.email) {
      throw new BusinessException(AuthErrorCode.GOOGLE_TOKEN_INVALID);
    }

    return {
      providerUid: payload.sub,
      email: payload.email,
      name: payload.name?.trim() || payload.email,
    };
  }
}
