import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsrEntity } from '../entities/usr.entity';
import { UsrSocialEntity } from '../entities/usr-social.entity';
import {
  CreateUserWithSocialParams,
  LinkSocialParams,
  UsrSocialRepositoryPort,
} from './usr-social.repository.port';

/** @description 사용자 소셜 연동 리포지토리 래퍼 */
@Injectable()
export class UsrSocialRepository implements UsrSocialRepositoryPort {
  constructor(
    @Optional()
    @InjectRepository(UsrSocialEntity)
    private readonly repository?: Repository<UsrSocialEntity>,
  ) {}

  /** @description TypeORM Repository 의존성 주입 여부 확인 */
  isReady(): boolean {
    return Boolean(this.repository);
  }

  /** @description 삭제되지 않은 소셜 연동을 provider/uid로 조회 */
  async findActiveByProvider(
    providerCd: string,
    providerUid: string,
  ): Promise<UsrSocialEntity | null> {
    if (!this.repository) {
      return null;
    }

    return this.repository.findOne({
      where: { providerCd, providerUid, isDeleted: false },
    });
  }

  /** @description 기존 사용자에 소셜 연동 레코드를 추가 */
  async linkSocialToUser(params: LinkSocialParams): Promise<UsrSocialEntity> {
    if (!this.repository) {
      throw new Error('UsrSocialRepository is not initialized');
    }

    const social = this.repository.create({
      usrId: params.usrId,
      providerCd: params.providerCd,
      providerUid: params.providerUid,
      providerEmail: params.providerEmail,
      lastLoginAt: new Date(),
    });
    return this.repository.save(social);
  }

  /** @description USR(소셜 가입) + USR_SOCIAL을 트랜잭션으로 함께 생성 */
  async createUserWithSocial(
    params: CreateUserWithSocialParams,
  ): Promise<{ usr: UsrEntity; social: UsrSocialEntity }> {
    if (!this.repository) {
      throw new Error('UsrSocialRepository is not initialized');
    }

    return this.repository.manager.transaction(async (manager) => {
      const usr = manager.create(UsrEntity, {
        usrEmail: params.usrEmail,
        usrNm: params.usrNm,
        pwd: null,
        pwdHash: null,
        joinTypeCd: params.providerCd,
      });
      const savedUsr = await manager.save(usr);

      const social = manager.create(UsrSocialEntity, {
        usrId: savedUsr.usrId,
        providerCd: params.providerCd,
        providerUid: params.providerUid,
        providerEmail: params.providerEmail,
        lastLoginAt: new Date(),
      });
      const savedSocial = await manager.save(social);

      return { usr: savedUsr, social: savedSocial };
    });
  }

  /** @description 소셜 연동의 마지막 로그인 일시를 갱신 */
  async touchLastLogin(social: UsrSocialEntity): Promise<void> {
    if (!this.repository) {
      throw new Error('UsrSocialRepository is not initialized');
    }

    social.lastLoginAt = new Date();
    await this.repository.save(social);
  }
}
