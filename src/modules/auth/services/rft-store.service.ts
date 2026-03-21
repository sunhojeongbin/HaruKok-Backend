import { DeviceType, RevokeReason } from '../enums/refresh-token.enum';

export type UpsertRefreshTokenParams = {
  usrId: string;
  refreshToken: string;
  jti: string;
  expiresAt: Date;
  deviceName?: string | null;
  deviceType?: DeviceType | null;
  ipAddress?: string | null;
  lastUsedAt?: Date | null;
};

export type VerifyRefreshTokenParams = {
  usrId: string;
  refreshToken: string;
  jti: string;
};

export abstract class AuthRefreshTokenStoreService {
  abstract upsertToken(params: UpsertRefreshTokenParams): Promise<void>;
  abstract verifyToken(params: VerifyRefreshTokenParams): Promise<boolean>;
  abstract revokeToken(usrId: string, reason: RevokeReason): Promise<void>;
}
