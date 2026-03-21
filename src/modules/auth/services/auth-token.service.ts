import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import ms, { StringValue } from 'ms';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { AuthResponse } from '../../../common/response/auth.response';
import {
  IssuedTokenPair,
  SignupPayload,
  TokenPayload,
} from '../types/auth.types';

@Injectable()
export class AuthTokenService {
  private readonly DEFAULT_REFRESH_TOKEN_EXPIRES_IN: StringValue = '30d';
  private readonly DEFAULT_REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

  constructor(private readonly jwtService: JwtService) {}

  /** @description 리프레시 토큰 서명 시크릿을 조회한다. */
  private getRefreshTokenSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET;
    if (!secret) {
      throw new BusinessException(AuthResponse.AUTH_CONFIG_INVALID);
    }
    return secret;
  }

  /** @description 환경변수에서 리프레시 토큰 만료값을 읽어 파싱 가능한 형태로 반환한다. */
  private getRefreshTokenExpiresIn(): number | StringValue {
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN?.trim();
    if (!expiresIn) {
      return this.DEFAULT_REFRESH_TOKEN_EXPIRES_IN;
    }

    if (/^\d+$/.test(expiresIn)) {
      return Number(expiresIn);
    }

    const parsed = ms(expiresIn as StringValue);
    if (typeof parsed === 'number' && parsed > 0) {
      return expiresIn as StringValue;
    }

    return this.DEFAULT_REFRESH_TOKEN_EXPIRES_IN;
  }

  /** @description 리프레시 토큰 만료값을 쿠키 maxAge(ms)로 변환한다. */
  private getRefreshTokenMaxAgeMs(expiresIn: number | StringValue): number {
    if (typeof expiresIn === 'number') {
      return expiresIn * 1000;
    }

    const parsed = ms(expiresIn);
    if (typeof parsed === 'number' && parsed > 0) {
      return parsed;
    }

    return this.DEFAULT_REFRESH_TOKEN_MAX_AGE_MS;
  }

  /** @description 액세스 토큰/리프레시 토큰 쌍을 발급한다. */
  issueTokenPair(payload: Omit<TokenPayload, 'jti'>): IssuedTokenPair {
    const jti = randomUUID();
    const tokenPayload: TokenPayload = { ...payload, jti };
    const accessToken = this.jwtService.sign(tokenPayload);
    const refreshExpiresIn = this.getRefreshTokenExpiresIn();
    const refreshToken = this.jwtService.sign(tokenPayload, {
      secret: this.getRefreshTokenSecret(),
      expiresIn: refreshExpiresIn,
    });
    const refreshTokenMaxAgeMs = this.getRefreshTokenMaxAgeMs(refreshExpiresIn);

    return {
      accessToken,
      refreshToken,
      refreshTokenMaxAgeMs,
      jti,
      refreshTokenExpiresAt: new Date(Date.now() + refreshTokenMaxAgeMs),
    };
  }

  /** @description 리프레시 토큰을 검증해 사용자 페이로드를 반환한다. */
  verifyRefreshToken(refreshToken: string): TokenPayload | null {
    let payload: { sub?: string; email?: string; jti?: string };
    try {
      const secret = this.getRefreshTokenSecret();
      payload = this.jwtService.verify<{
        sub?: string;
        email?: string;
        jti?: string;
      }>(refreshToken, {
        secret,
      });
    } catch {
      return null;
    }

    if (
      !payload.sub ||
      typeof payload.sub !== 'string' ||
      !payload.jti ||
      typeof payload.jti !== 'string'
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email ?? '',
      jti: payload.jti,
    };
  }

  /** @description 회원가입 토큰을 발급한다. */
  issueSignupToken(payload: SignupPayload, ttlSec: number): string {
    return this.jwtService.sign(payload, { expiresIn: ttlSec });
  }

  /** @description 회원가입 토큰을 검증하고 페이로드를 반환한다. */
  verifySignupToken(signupToken: string): SignupPayload | null {
    try {
      return this.jwtService.verify<SignupPayload>(signupToken);
    } catch {
      return null;
    }
  }
}
