import { NtfTokenEntity } from '../../entities/ntf-token.entity';

export const NTF_TOKEN_REPOSITORY = Symbol('NTF_TOKEN_REPOSITORY');

/** @description 활성 토큰 행 (발송 대상 묶음용) */
export type ActiveTokenRow = {
  usrId: string;
  fcmToken: string;
};

/** @description FCM 디바이스 토큰 저장소 추상화 */
export interface NtfTokenRepositoryPort {
  isReady(): boolean;

  /** @description 토큰 저장/갱신. 동일 fcm_token 존재 시 소유자·플랫폼을 재바인딩하고 활성화 */
  upsertToken(
    usrId: string,
    fcmToken: string,
    platformCd: string,
  ): Promise<NtfTokenEntity>;

  /** @description 사용자 소유 토큰 1건 삭제. 삭제된 행이 있으면 true */
  removeByUsrAndToken(usrId: string, fcmToken: string): Promise<boolean>;

  /** @description 모든 활성 토큰을 (사용자, 토큰) 단위로 조회 */
  findAllActiveTokens(): Promise<ActiveTokenRow[]>;

  /** @description 특정 사용자의 활성 FCM 토큰 목록을 조회 */
  findActiveTokensByUser(usrId: string): Promise<string[]>;

  /** @description 지정 토큰들을 비활성화(무효 토큰 정리) */
  deactivateTokens(fcmTokens: string[]): Promise<void>;
}
