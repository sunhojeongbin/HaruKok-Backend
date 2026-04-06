import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const REFRESH_TOKEN_COOKIE_PREFIX = 'refreshToken=';
const REFRESH_TOKEN_PREFIX_LENGTH = REFRESH_TOKEN_COOKIE_PREFIX.length;

type RequestWithRefreshToken = Request & {
  refreshToken?: string | null;
};

/**
 * @description refresh/logout 요청에서 refreshToken 쿠키만 빠르게 추출하는 미들웨어
 */
@Injectable()
export class RefreshTokenCookieMiddleware implements NestMiddleware {
  private extractRefreshToken(cookieHeader?: string): string | null {
    if (!cookieHeader) {
      return null;
    }

    const headerLength = cookieHeader.length;
    let cursor = 0;

    while (cursor < headerLength) {
      // 세미콜론 구분자와 공백을 건너뛴다.
      while (cursor < headerLength) {
        const charCode = cookieHeader.charCodeAt(cursor);
        if (charCode !== 59 && charCode !== 32) {
          break;
        }
        cursor += 1;
      }

      if (cursor >= headerLength) {
        break;
      }

      if (cookieHeader.startsWith(REFRESH_TOKEN_COOKIE_PREFIX, cursor)) {
        const valueStart = cursor + REFRESH_TOKEN_PREFIX_LENGTH;
        const delimiterIndex = cookieHeader.indexOf(';', valueStart);
        const rawValue =
          delimiterIndex === -1
            ? cookieHeader.slice(valueStart)
            : cookieHeader.slice(valueStart, delimiterIndex);

        if (!rawValue) {
          return null;
        }

        if (!rawValue.includes('%')) {
          return rawValue;
        }

        try {
          return decodeURIComponent(rawValue);
        } catch {
          return null;
        }
      }

      const nextDelimiter = cookieHeader.indexOf(';', cursor);
      if (nextDelimiter === -1) {
        break;
      }

      cursor = nextDelimiter + 1;
    }

    return null;
  }

  use(req: RequestWithRefreshToken, _res: Response, next: NextFunction): void {
    req.refreshToken = this.extractRefreshToken(req.headers.cookie);
    next();
  }
}
