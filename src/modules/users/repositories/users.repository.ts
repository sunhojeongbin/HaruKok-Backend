import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsrEntity } from '../entities/usr.entity';

/** @description 사용자 생성에 필요한 저장 파라미터 */
type CreateUserParams = {
  usrEmail: string;
  usrName: string;
  password: string;
  passwordHash: string;
};

/** @description 사용자 리포지토리 래퍼 */
@Injectable()
export class UsersRepository {
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
      where: { usrEmail: email },
    });
  }

  /** @description 사용자 ID로 사용자 정보 조회 */
  async findById(id: string): Promise<UsrEntity | null> {
    if (!this.repository) {
      return null;
    }

    return this.repository.findOne({
      where: { usrId: id },
    });
  }

  /** @description 사용자 엔티티를 생성하고 저장 */
  async createAndSave(params: CreateUserParams): Promise<UsrEntity> {
    if (!this.repository) {
      throw new Error('UsersRepository is not initialized');
    }

    const user = this.repository.create(params);
    return this.repository.save(user);
  }

  /** @description 사용자 엔티티를 저장 */
  async save(user: UsrEntity): Promise<UsrEntity> {
    if (!this.repository) {
      throw new Error('UsersRepository is not initialized');
    }

    return this.repository.save(user);
  }
}
