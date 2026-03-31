import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CtgEntity } from '../../ctg/entities/ctg.entity';
import { TodoEntity } from '../../todo/entities/todo.entity';
import { RptType } from '../enums/rpt-type.enum';
import { RtnRptEntity } from '../entities/rtn-rpt.entity';
import { RtnEntity } from '../entities/rtn.entity';
import {
  CreateRoutineParams,
  CreateRoutineResult,
  RtnRepositoryPort,
} from './rtn.repository.port';

/** @description TypeORM 기반 루틴 저장소 */
@Injectable()
export class TypeOrmRtnRepository implements RtnRepositoryPort {
  constructor(
    @InjectRepository(RtnEntity)
    private readonly repository: Repository<RtnEntity>,
  ) {}

  /** @description 사용자 소유의 활성 카테고리인지 확인 */
  async isCategoryOwnedByUser(usrId: string, ctgId: string): Promise<boolean> {
    const category = await this.repository.manager
      .getRepository(CtgEntity)
      .findOne({
        where: {
          ctgId,
          usrId,
          isDeleted: false,
        },
      });
    return Boolean(category);
  }

  /** @description 루틴/반복설정/투두를 트랜잭션으로 생성 */
  async createWithTodos(
    params: CreateRoutineParams,
  ): Promise<CreateRoutineResult> {
    return this.repository.manager.transaction(async (manager) => {
      const routine = manager.create(RtnEntity, {
        usrId: params.usrId,
        ctgId: params.ctgId,
        rtnContent: params.rtnContent,
        rtnDesc: null,
        rptTypeCd: params.rptTypeCd,
        startDt: params.startDt,
        endDt: params.endDt,
        alarmTime: params.alarmTime,
      });

      const savedRoutine = await manager.save(RtnEntity, routine);

      const repeats: RtnRptEntity[] = [];
      if (params.rptTypeCd === RptType.DAILY) {
        repeats.push(
          manager.create(RtnRptEntity, {
            rtnId: savedRoutine.rtnId,
            rptTypeCd: RptType.DAILY,
            dayOfWeek: null,
            dayOfMth: null,
          }),
        );
      } else if (params.rptTypeCd === RptType.WEEKLY) {
        for (const dayOfWeek of params.dayOfWeeks) {
          repeats.push(
            manager.create(RtnRptEntity, {
              rtnId: savedRoutine.rtnId,
              rptTypeCd: RptType.WEEKLY,
              dayOfWeek,
              dayOfMth: null,
            }),
          );
        }
      } else {
        for (const dayOfMth of params.dayOfMths) {
          repeats.push(
            manager.create(RtnRptEntity, {
              rtnId: savedRoutine.rtnId,
              rptTypeCd: RptType.MONTHLY,
              dayOfWeek: null,
              dayOfMth,
            }),
          );
        }
      }
      await manager.save(RtnRptEntity, repeats);

      const nextSortOrderByDate = new Map<string, number>();
      for (const todoDate of params.todoDates) {
        if (!nextSortOrderByDate.has(todoDate)) {
          const raw = await manager
            .createQueryBuilder(TodoEntity, 'todo')
            .select('MAX(todo.sort_order)', 'maxSortOrder')
            .where('todo.usr_id = :usrId', { usrId: params.usrId })
            .andWhere('todo.todo_date = :todoDate', { todoDate })
            .andWhere('todo.is_deleted = false')
            .getRawOne<{ maxSortOrder: string | null }>();

          const nextSortOrder =
            raw?.maxSortOrder !== null && raw?.maxSortOrder !== undefined
              ? Number(raw.maxSortOrder) + 1
              : 0;

          nextSortOrderByDate.set(todoDate, nextSortOrder);
        }

        const sortOrder = nextSortOrderByDate.get(todoDate) ?? 0;
        const todo = manager.create(TodoEntity, {
          usrId: params.usrId,
          ctgId: params.ctgId,
          content: params.rtnContent,
          memo: null,
          todoDate,
          sortOrder,
        });
        await manager.save(TodoEntity, todo);
        nextSortOrderByDate.set(todoDate, sortOrder + 1);
      }

      const routineWithRepeats = await manager.findOne(RtnEntity, {
        where: {
          rtnId: savedRoutine.rtnId,
          isDeleted: false,
        },
        relations: {
          rtnRpts: true,
        },
      });

      return {
        rtn: routineWithRepeats ?? savedRoutine,
        createdTodoCount: params.todoDates.length,
      };
    });
  }

  /** @description 사용자 활성 루틴 목록(반복 설정 포함)을 조회 */
  findAllByUser(usrId: string): Promise<RtnEntity[]> {
    return this.repository
      .createQueryBuilder('rtn')
      .leftJoinAndSelect('rtn.rtnRpts', 'rpt', 'rpt.is_deleted = false')
      .where('rtn.usr_id = :usrId', { usrId })
      .andWhere('rtn.is_deleted = false')
      .orderBy('rtn.start_dt', 'ASC')
      .addOrderBy('rtn.end_dt', 'ASC')
      .addOrderBy('rtn.created_at', 'ASC')
      .addOrderBy('rpt.day_of_week', 'ASC')
      .addOrderBy('rpt.day_of_mth', 'ASC')
      .getMany();
  }
}
