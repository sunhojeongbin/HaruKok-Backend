import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { RftEntity } from '../entities/rft.entity';
import { RevokeReason } from '../enums/refresh-token.enum';
import {
  AuthRefreshTokenStoreService,
  UpsertRefreshTokenParams,
  VerifyRefreshTokenParams,
} from './rft-store.service';

@Injectable()
export class DbAuthRefreshTokenStoreService extends AuthRefreshTokenStoreService {
  constructor(
    @InjectRepository(RftEntity)
    private readonly repository: Repository<RftEntity>,
  ) {
    super();
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async upsertToken(params: UpsertRefreshTokenParams): Promise<void> {
    const existing = await this.repository.findOne({
      where: { usrId: params.usrId },
    });

    if (!existing) {
      const entity = this.repository.create({
        usrId: params.usrId,
        tokenHash: this.hashToken(params.refreshToken),
        jti: params.jti,
        deviceName: params.deviceName ?? null,
        deviceType: params.deviceType ?? null,
        ipAddress: params.ipAddress ?? null,
        issuedAt: new Date(),
        expiresAt: params.expiresAt,
        lastUsedAt: params.lastUsedAt ?? null,
        isRevoked: false,
        revokedAt: null,
        revokeReason: null,
      });
      await this.repository.save(entity);
      return;
    }

    existing.tokenHash = this.hashToken(params.refreshToken);
    existing.jti = params.jti;
    existing.deviceName =
      params.deviceName === undefined ? existing.deviceName : params.deviceName;
    existing.deviceType =
      params.deviceType === undefined ? existing.deviceType : params.deviceType;
    existing.ipAddress =
      params.ipAddress === undefined ? existing.ipAddress : params.ipAddress;
    existing.issuedAt = new Date();
    existing.expiresAt = params.expiresAt;
    existing.lastUsedAt =
      params.lastUsedAt === undefined ? existing.lastUsedAt : params.lastUsedAt;
    existing.isRevoked = false;
    existing.revokedAt = null;
    existing.revokeReason = null;

    await this.repository.save(existing);
  }

  async verifyToken(params: VerifyRefreshTokenParams): Promise<boolean> {
    const token = await this.repository.findOne({
      where: { usrId: params.usrId },
    });
    if (!token) {
      return false;
    }

    if (token.isRevoked) {
      return false;
    }

    if (token.expiresAt <= new Date()) {
      token.isRevoked = true;
      token.revokedAt = new Date();
      token.revokeReason = RevokeReason.EXPIRED;
      await this.repository.save(token);
      return false;
    }

    if (token.jti !== params.jti) {
      return false;
    }

    return token.tokenHash === this.hashToken(params.refreshToken);
  }

  async revokeToken(usrId: string, reason: RevokeReason): Promise<void> {
    const token = await this.repository.findOne({
      where: { usrId },
    });
    if (!token || token.isRevoked) {
      return;
    }

    token.isRevoked = true;
    token.revokedAt = new Date();
    token.revokeReason = reason;
    await this.repository.save(token);
  }
}
