import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NtfTokenEntity } from '../../entities/ntf-token.entity';
import {
  ActiveTokenRow,
  NtfTokenRepositoryPort,
} from '../../application/ports/ntf-token.repository.port';

/** @description TypeORM 기반 FCM 디바이스 토큰 저장소 */
@Injectable()
export class TypeOrmNtfTokenRepository implements NtfTokenRepositoryPort {
  constructor(
    @InjectRepository(NtfTokenEntity)
    private readonly repository: Repository<NtfTokenEntity>,
  ) {}

  isReady(): boolean {
    return true;
  }

  /** @description fcm_token 유니크 충돌 시 소유자·플랫폼 재바인딩 + 활성화 */
  async upsertToken(
    usrId: string,
    fcmToken: string,
    platformCd: string,
  ): Promise<NtfTokenEntity> {
    await this.repository.upsert(
      {
        usrId,
        fcmToken,
        platformCd,
        isActive: true,
        lastUsedAt: () => 'NOW()',
      },
      {
        conflictPaths: ['fcmToken'],
        skipUpdateIfNoValuesChanged: false,
      },
    );

    const saved = await this.repository.findOneByOrFail({ fcmToken });
    return saved;
  }

  /** @description 사용자 소유 토큰 1건 삭제 */
  async removeByUsrAndToken(usrId: string, fcmToken: string): Promise<boolean> {
    const result = await this.repository.delete({ usrId, fcmToken });
    return (result.affected ?? 0) > 0;
  }

  /** @description 모든 활성 토큰을 (사용자, 토큰) 단위로 조회 */
  findAllActiveTokens(): Promise<ActiveTokenRow[]> {
    return this.repository
      .createQueryBuilder('token')
      .select('token.usr_id', 'usrId')
      .addSelect('token.fcm_token', 'fcmToken')
      .where('token.is_active = true')
      .orderBy('token.usr_id', 'ASC')
      .getRawMany<ActiveTokenRow>();
  }

  /** @description 특정 사용자의 활성 FCM 토큰 목록 조회 */
  async findActiveTokensByUser(usrId: string): Promise<string[]> {
    const rows = await this.repository
      .createQueryBuilder('token')
      .select('token.fcm_token', 'fcmToken')
      .where('token.is_active = true')
      .andWhere('token.usr_id = :usrId', { usrId })
      .getRawMany<{ fcmToken: string }>();
    return rows.map((row) => row.fcmToken);
  }

  /** @description 지정 토큰들을 비활성화 */
  async deactivateTokens(fcmTokens: string[]): Promise<void> {
    if (fcmTokens.length === 0) {
      return;
    }
    await this.repository.update(
      { fcmToken: In(fcmTokens) },
      { isActive: false },
    );
  }
}
