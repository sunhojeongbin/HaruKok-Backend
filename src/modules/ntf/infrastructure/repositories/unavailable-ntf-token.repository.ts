import { Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { NtfErrorCode } from '../../errors/ntf-error-code';
import { NtfTokenEntity } from '../../entities/ntf-token.entity';
import {
  ActiveTokenRow,
  NtfTokenRepositoryPort,
} from '../../application/ports/ntf-token.repository.port';

/** @description SKIP_DB 환경에서 사용하는 FCM 디바이스 토큰 저장소 */
@Injectable()
export class UnavailableNtfTokenRepository implements NtfTokenRepositoryPort {
  private rejectRepositoryNotReady<T>(): Promise<T> {
    return Promise.reject(
      new BusinessException(NtfErrorCode.NTF_TOKEN_REPOSITORY_NOT_READY),
    );
  }

  private consume(...args: unknown[]): void {
    void args;
  }

  isReady(): boolean {
    return false;
  }

  upsertToken(
    _usrId: string,
    _fcmToken: string,
    _platformCd: string,
  ): Promise<NtfTokenEntity> {
    this.consume(_usrId, _fcmToken, _platformCd);
    return this.rejectRepositoryNotReady();
  }

  removeByUsrAndToken(_usrId: string, _fcmToken: string): Promise<boolean> {
    this.consume(_usrId, _fcmToken);
    return this.rejectRepositoryNotReady();
  }

  findAllActiveTokens(): Promise<ActiveTokenRow[]> {
    return this.rejectRepositoryNotReady();
  }

  findActiveTokensByUser(_usrId: string): Promise<string[]> {
    this.consume(_usrId);
    return this.rejectRepositoryNotReady();
  }

  deactivateTokens(_fcmTokens: string[]): Promise<void> {
    this.consume(_fcmTokens);
    return this.rejectRepositoryNotReady();
  }
}
