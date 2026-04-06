import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsrEntity } from '../entities/usr.entity';
import { UsrRepositoryPort } from './usr.repository.port';

/** @description 사용자 생성에 필요한 저장 파라미터 */
type CreateUsrParams = {
  usrEmail: string | null;
  usrNm: string;
  pwd: string | null;
  pwdHash: string | null;
  joinTypeCd?: string;
  usrStatCd?: string;
  usrRoleCd?: string;
};

/** @description 사용자 리포지토리 래퍼 */
@Injectable()
export class UsrRepository implements UsrRepositoryPort {
  constructor(
    @Optional()
    @InjectRepository(UsrEntity)
    private readonly repository?: Repository<UsrEntity>,
  ) {}

  /** @description TypeORM Repository 의존성 주입 여부 확인 */
  isReady(): boolean {
    return Boolean(this.repository);
  }

  /** @description 이메일로 사용자 정보 조회 */
  async findByEmail(email: string): Promise<UsrEntity | null> {
    if (!this.repository) {
      return null;
    }

    return this.repository.findOne({
      where: { usrEmail: email, isDeleted: false },
    });
  }

  /** @description 이메일로 활성 사용자 정보 조회 */
  async findActiveByEmail(email: string): Promise<UsrEntity | null> {
    if (!this.repository) {
      return null;
    }

    return this.repository.findOne({
      where: { usrEmail: email, isDeleted: false, usrStatCd: 'ACTIVE' },
    });
  }

  /** @description 사용자 ID로 사용자 정보 조회 */
  async findById(id: string): Promise<UsrEntity | null> {
    if (!this.repository) {
      return null;
    }

    return this.repository.findOne({
      where: { usrId: id, isDeleted: false },
    });
  }

  /** @description 사용자 ID로 활성 사용자 정보 조회 */
  async findActiveById(id: string): Promise<UsrEntity | null> {
    if (!this.repository) {
      return null;
    }

    return this.repository.findOne({
      where: { usrId: id, isDeleted: false, usrStatCd: 'ACTIVE' },
    });
  }

  /** @description 사용자 엔티티를 생성하고 저장 */
  async createAndSave(params: CreateUsrParams): Promise<UsrEntity> {
    if (!this.repository) {
      throw new Error('UsrRepository is not initialized');
    }

    const usr = this.repository.create(params);
    return this.repository.save(usr);
  }

  /** @description 사용자 엔티티를 저장 */
  async save(usr: UsrEntity): Promise<UsrEntity> {
    if (!this.repository) {
      throw new Error('UsrRepository is not initialized');
    }

    return this.repository.save(usr);
  }
}
