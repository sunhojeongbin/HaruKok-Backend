import { UsrEntity } from '../entities/usr.entity';
import { UsrSocialEntity } from '../entities/usr-social.entity';

export const USR_SOCIAL_REPOSITORY = Symbol('USR_SOCIAL_REPOSITORY');

/** @description 기존 사용자에 소셜 연동을 추가할 때 사용하는 파라미터 */
export type LinkSocialParams = {
  usrId: string;
  providerCd: string;
  providerUid: string;
  providerEmail: string | null;
};

/** @description 소셜 사용자를 신규 생성할 때 사용하는 파라미터 */
export type CreateUserWithSocialParams = {
  usrEmail: string | null;
  usrNm: string;
  providerCd: string;
  providerUid: string;
  providerEmail: string | null;
};

export interface UsrSocialRepositoryPort {
  isReady(): boolean;

  /** @description 삭제되지 않은 소셜 연동을 provider/uid로 조회 */
  findActiveByProvider(
    providerCd: string,
    providerUid: string,
  ): Promise<UsrSocialEntity | null>;

  /** @description 기존 사용자에 소셜 연동 레코드를 추가 */
  linkSocialToUser(params: LinkSocialParams): Promise<UsrSocialEntity>;

  /** @description USR(소셜 가입) + USR_SOCIAL을 트랜잭션으로 함께 생성 */
  createUserWithSocial(
    params: CreateUserWithSocialParams,
  ): Promise<{ usr: UsrEntity; social: UsrSocialEntity }>;

  /** @description 소셜 연동의 마지막 로그인 일시를 갱신 */
  touchLastLogin(social: UsrSocialEntity): Promise<void>;
}
