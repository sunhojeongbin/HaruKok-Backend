import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CtgEntity } from '../entities/ctg.entity';
import { VisibilityType } from '../enums/visibility-type.enum';

type CreateCategoryParams = {
  usrId: string;
  ctgName: string;
  visibility: VisibilityType;
  colorCode: string;
  sortOrder: number;
};

@Injectable()
export class CtgRepository {
  constructor(
    @Optional()
    @InjectRepository(CtgEntity)
    private readonly repository?: Repository<CtgEntity>,
  ) {}

  isReady(): boolean {
    return Boolean(this.repository);
  }

  private getRepository(): Repository<CtgEntity> {
    if (!this.repository) {
      throw new Error('CtgRepository is not initialized');
    }
    return this.repository;
  }

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

  async findAllByUser(usrId: string): Promise<CtgEntity[]> {
    if (!this.repository) {
      return [];
    }

    return this.repository.find({
      where: { usrId, isDeleted: false },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async createAndSave(params: CreateCategoryParams): Promise<CtgEntity> {
    const repository = this.getRepository();
    const category = repository.create(params);
    return repository.save(category);
  }

  async save(category: CtgEntity): Promise<CtgEntity> {
    return this.getRepository().save(category);
  }

  async saveMany(categories: CtgEntity[]): Promise<CtgEntity[]> {
    return this.getRepository().save(categories);
  }
}
