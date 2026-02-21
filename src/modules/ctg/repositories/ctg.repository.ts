import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CtgEntity } from '../entities/ctg.entity';
import { VisibilityType } from '../enums/visibility-type.enum';

/** @description 카테고리 생성에 필요한 저장 파라미터 */
type CreateCategoryParams = {
  usrId: string;
  ctgName: string;
  visibility: VisibilityType;
  colorCode: string;
  sortOrder: number;
};

/** @description 카테고리 리포지토리 래퍼 */
@Injectable()
export class CtgRepository {
  constructor(
    @Optional()
    @InjectRepository(CtgEntity)
    private readonly repository?: Repository<CtgEntity>,
  ) {}

  /** @description TypeORM Repository 의존성 주입 여부 확인 */
  isReady(): boolean {
    return Boolean(this.repository);
  }

  /** @description 내부 TypeORM Repository를 반환 */
  private getRepository(): Repository<CtgEntity> {
    if (!this.repository) {
      throw new Error('CtgRepository is not initialized');
    }
    return this.repository;
  }

  /** @description 사용자/카테고리명으로 활성 카테고리를 조회 */
  async findByUserAndName(
    usrId: string,
    ctgName: string,
    excludeCtgId?: string,
  ): Promise<CtgEntity | null> {
    if (!this.repository) {
      return null;
    }

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
    if (!this.repository) {
      return null;
    }

    return this.repository.findOne({
      where: { ctgId, usrId, isDeleted: false },
    });
  }

  /** @description 사용자 활성 카테고리 목록을 정렬 순서 기준으로 조회 */
  async findAllByUser(usrId: string): Promise<CtgEntity[]> {
    if (!this.repository) {
      return [];
    }

    return this.repository.find({
      where: { usrId, isDeleted: false },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  /** @description 카테고리 엔티티를 생성하고 저장 */
  async createAndSave(params: CreateCategoryParams): Promise<CtgEntity> {
    const repository = this.getRepository();
    const category = repository.create(params);
    return repository.save(category);
  }

  /** @description 카테고리 엔티티 단건을 저장 */
  async save(category: CtgEntity): Promise<CtgEntity> {
    return this.getRepository().save(category);
  }

  /** @description 카테고리 엔티티 배열을 일괄 저장 */
  async saveMany(categories: CtgEntity[]): Promise<CtgEntity[]> {
    return this.getRepository().save(categories);
  }

  /** @description 카테고리 소프트 삭제와 잔여 카테고리 재정렬을 트랜잭션으로 처리 */
  async softDeleteAndReindex(
    category: CtgEntity,
    usrId: string,
  ): Promise<void> {
    const repository = this.getRepository();

    await repository.manager.transaction(async (manager) => {
      await manager.save(CtgEntity, category);

      const restCategories = await manager.find(CtgEntity, {
        where: { usrId, isDeleted: false },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      });

      for (let i = 0; i < restCategories.length; i += 1) {
        restCategories[i].sortOrder = i;
      }

      await manager.save(CtgEntity, restCategories);
    });
  }
}
