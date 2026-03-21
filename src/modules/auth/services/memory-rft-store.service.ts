import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { RevokeReason } from '../enums/refresh-token.enum';
import {
  AuthRefreshTokenStoreService,
  UpsertRefreshTokenParams,
  VerifyRefreshTokenParams,
} from './rft-store.service';

type StoredRefreshToken = {
  tokenHash: string;
  jti: string;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt: Date | null;
  revokeReason: RevokeReason | null;
  lastUsedAt: Date | null;
};

@Injectable()
export class InMemoryAuthRefreshTokenStoreService extends AuthRefreshTokenStoreService {
  private readonly store = new Map<string, StoredRefreshToken>();

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  upsertToken(params: UpsertRefreshTokenParams): Promise<void> {
    this.store.set(params.usrId, {
      tokenHash: this.hashToken(params.refreshToken),
      jti: params.jti,
      expiresAt: params.expiresAt,
      isRevoked: false,
      revokedAt: null,
      revokeReason: null,
      lastUsedAt: params.lastUsedAt ?? null,
    });
    return Promise.resolve();
  }

  verifyToken(params: VerifyRefreshTokenParams): Promise<boolean> {
    const token = this.store.get(params.usrId);
    if (!token) {
      return Promise.resolve(false);
    }

    if (token.isRevoked) {
      return Promise.resolve(false);
    }

    if (token.expiresAt <= new Date()) {
      token.isRevoked = true;
      token.revokedAt = new Date();
      token.revokeReason = RevokeReason.EXPIRED;
      this.store.set(params.usrId, token);
      return Promise.resolve(false);
    }

    if (token.jti !== params.jti) {
      return Promise.resolve(false);
    }

    return Promise.resolve(
      token.tokenHash === this.hashToken(params.refreshToken),
    );
  }

  revokeToken(usrId: string, reason: RevokeReason): Promise<void> {
    const token = this.store.get(usrId);
    if (!token || token.isRevoked) {
      return Promise.resolve();
    }

    token.isRevoked = true;
    token.revokedAt = new Date();
    token.revokeReason = reason;
    this.store.set(usrId, token);
    return Promise.resolve();
  }
}
