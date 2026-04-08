import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CtgEntity } from '../../entities/ctg.entity';
import { UsrEntity } from '../../../usr/entities/usr.entity';
import {
  CreateCategoryWithLimitParams,
  CtgRepositoryPort,
} from '../../application/ports/ctg.repository.port';

/** @description TypeORM 기반 카테고리 저장소 */
@Injectable()
export class TypeOrmCtgRepository implements CtgRepositoryPort {
  constructor(
    @InjectRepository(CtgEntity)
    private readonly repository: Repository<CtgEntity>,
  ) {}

  /** @description 사용자/카테고리명으로 활성 카테고리를 조회 */
  async findByUserAndName(
    usrId: string,
    ctgName: string,
    excludeCtgId?: string,
  ): Promise<CtgEntity | null> {
    const query = this.repository
      .createQueryBuilder('ctg')
      .where('ctg.usr_id = :usrId', { usrId })
      .andWhere('ctg.ctg_name = :ctgName', { ctgName })
      .andWhere('ctg.is_deleted = false');

    if (excludeCtgId) {
      query.andWhere('ctg.ctg_id != :excludeCtgId', { excludeCtgId });
    }

    return query.getOne();
  }

  /**
   * @description 카테고리 ID와 사용자 ID로 활성 카테고리 단건을 조회
   * @param ctgId 조회할 카테고리 ID
   * @param usrId 조회할 사용자 ID
   * @returns 활성 카테고리 엔티티 또는 null
   */
  async findByIdAndUser(
    ctgId: string,
    usrId: string,
  ): Promise<CtgEntity | null> {
    return this.repository.findOne({
      where: { ctgId, usrId, isDeleted: false },
    });
  }

  /** @description 사용자 활성 카테고리 목록을 정렬 순서 기준으로 조회 */
  async findAllByUser(usrId: string): Promise<CtgEntity[]> {
    return this.repository.find({
      where: { usrId, isDeleted: false },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  /** @description 사용자별 최대 개수 제한을 검증하며 카테고리를 생성 */
  async createWithUserLimit(
    params: CreateCategoryWithLimitParams,
    maxCategoryCount: number,
  ): Promise<CtgEntity | null> {
    return await this.repository.manager.transaction(async (manager) => {
      await manager
        .getRepository(UsrEntity)
        .createQueryBuilder('usr')
        .where('usr.usr_id = :usrId', { usrId: params.usrId })
        .setLock('pessimistic_write')
        .getOne();

      const categories = await manager.find(CtgEntity, {
        where: { usrId: params.usrId, isDeleted: false },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      });

      if (categories.length >= maxCategoryCount) {
        return null;
      }

      const maxSortOrder = categories.reduce(
        (max, category) => Math.max(max, category.sortOrder),
        -1,
      );

      const category = manager.create(CtgEntity, {
        ...params,
        sortOrder: maxSortOrder + 1,
      });

      return manager.save(CtgEntity, category);
    });
  }

  /** @description 카테고리 엔티티 단건을 저장 */
  async save(category: CtgEntity): Promise<CtgEntity> {
    return this.repository.save(category);
  }

  /** @description 카테고리 엔티티 배열을 일괄 저장 */
  async saveMany(categories: CtgEntity[]): Promise<CtgEntity[]> {
    return this.repository.save(categories);
  }
}
