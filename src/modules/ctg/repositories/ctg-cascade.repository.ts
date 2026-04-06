import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RtnEntity } from '../../rtn/entities/rtn.entity';
import { RtnRptEntity } from '../../rtn/entities/rtn-rpt.entity';
import { TodoEntity } from '../../todo/entities/todo.entity';
import { CtgEntity } from '../entities/ctg.entity';
import { CtgCascadeRepositoryPort } from './ctg-cascade.repository.port';

@Injectable()
export class TypeOrmCtgCascadeRepository implements CtgCascadeRepositoryPort {
  constructor(
    @InjectRepository(CtgEntity)
    private readonly repository: Repository<CtgEntity>,
  ) {}

  async softDeleteAndReindex(
    category: CtgEntity,
    usrId: string,
  ): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      const rawRoutines = await manager
        .createQueryBuilder(RtnEntity, 'rtn')
        .select('rtn.rtn_id', 'rtnId')
        .where('rtn.usr_id = :usrId', { usrId })
        .andWhere('rtn.ctg_id = :ctgId', { ctgId: category.ctgId })
        .andWhere('rtn.is_deleted = false')
        .getRawMany<{ rtnId: string }>();
      const routineIds = rawRoutines.map((row) => row.rtnId);

      if (routineIds.length > 0) {
        await manager
          .createQueryBuilder()
          .update(RtnRptEntity)
          .set({ isDeleted: true })
          .where('rtn_id IN (:...routineIds)', { routineIds })
          .andWhere('is_deleted = false')
          .execute();

        await manager
          .createQueryBuilder()
          .update(RtnEntity)
          .set({ isDeleted: true })
          .where('usr_id = :usrId', { usrId })
          .andWhere('ctg_id = :ctgId', { ctgId: category.ctgId })
          .andWhere('is_deleted = false')
          .execute();
      }

      await manager
        .createQueryBuilder()
        .update(TodoEntity)
        .set({
          isDeleted: true,
          deletedAt: () => 'NOW()',
        })
        .where('usr_id = :usrId', { usrId })
        .andWhere('ctg_id = :ctgId', { ctgId: category.ctgId })
        .andWhere('is_deleted = false')
        .execute();

      if (routineIds.length > 0) {
        await manager
          .createQueryBuilder()
          .update(TodoEntity)
          .set({
            isDeleted: true,
            deletedAt: () => 'NOW()',
          })
          .where('usr_id = :usrId', { usrId })
          .andWhere('rtn_id IN (:...routineIds)', { routineIds })
          .andWhere('is_deleted = false')
          .execute();
      }

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
