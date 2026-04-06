import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, MoreThanOrEqual, Repository } from 'typeorm';
import { CtgEntity } from '../../ctg/entities/ctg.entity';
import { TodoEntity } from '../../todo/entities/todo.entity';
import {
  buildRepeatSeeds,
  normalizeRepeatOptions,
} from '../domain/routine-repeat.policy';
import { RptType } from '../enums/rpt-type.enum';
import { RtnRptEntity } from '../entities/rtn-rpt.entity';
import { RtnEntity } from '../entities/rtn.entity';
import {
  CreateRoutineParams,
  CreateRoutineResult,
  RtnRepositoryPort,
  UpdateRoutineParams,
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
          isEnded: false,
        },
      });
    return Boolean(category);
  }

  /** @description 루틴 ID와 사용자 ID로 활성 루틴 단건(반복 설정 포함)을 조회 */
  findByIdAndUser(rtnId: string, usrId: string): Promise<RtnEntity | null> {
    return this.repository
      .createQueryBuilder('rtn')
      .leftJoinAndSelect('rtn.rtnRpts', 'rpt', 'rpt.is_deleted = false')
      .where('rtn.rtn_id = :rtnId', { rtnId })
      .andWhere('rtn.usr_id = :usrId', { usrId })
      .andWhere('rtn.is_deleted = false')
      .orderBy('rpt.day_of_week', 'ASC')
      .addOrderBy('rpt.day_of_mth', 'ASC')
      .getOne();
  }

  /** @description 지정 날짜의 다음 투두 정렬 순서를 조회 */
  private async resolveNextTodoSortOrder(
    manager: EntityManager,
    usrId: string,
    todoDate: string,
  ): Promise<number> {
    const raw = await manager
      .createQueryBuilder(TodoEntity, 'todo')
      .select('MAX(todo.sort_order)', 'maxSortOrder')
      .where('todo.usr_id = :usrId', { usrId })
      .andWhere('todo.todo_date = :todoDate', { todoDate })
      .andWhere('todo.is_deleted = false')
      .getRawOne<{ maxSortOrder: string | null }>();

    return raw?.maxSortOrder !== null && raw?.maxSortOrder !== undefined
      ? Number(raw.maxSortOrder) + 1
      : 0;
  }

  /** @description 반복 조건에 맞는 루틴 투두를 생성 */
  private async createRoutineTodosWithManager(
    manager: EntityManager,
    usrId: string,
    ctgId: string,
    rtnId: string,
    rtnContent: string,
    todoDates: string[],
  ): Promise<void> {
    const nextSortOrderByDate = new Map<string, number>();

    for (const todoDate of todoDates) {
      if (!nextSortOrderByDate.has(todoDate)) {
        const nextSortOrder = await this.resolveNextTodoSortOrder(
          manager,
          usrId,
          todoDate,
        );
        nextSortOrderByDate.set(todoDate, nextSortOrder);
      }

      const sortOrder = nextSortOrderByDate.get(todoDate) ?? 0;
      const todo = manager.create(TodoEntity, {
        usrId,
        ctgId,
        rtnId,
        content: rtnContent,
        memo: null,
        todoDate,
        sortOrder,
      });
      await manager.save(TodoEntity, todo);
      nextSortOrderByDate.set(todoDate, sortOrder + 1);
    }
  }

  /** @description 오늘 이후 루틴 투두를 diff 기반으로 동기화 */
  private async syncRoutineTodosFromTodayWithManager(
    manager: EntityManager,
    usrId: string,
    rtnId: string,
    ctgId: string,
    rtnContent: string,
    todayDate: string,
    desiredTodoDates: string[],
  ): Promise<void> {
    const futureTodos = await manager.find(TodoEntity, {
      where: {
        usrId,
        rtnId,
        isDeleted: false,
        todoDate: MoreThanOrEqual(todayDate),
      },
      order: {
        todoDate: 'ASC',
        createdAt: 'ASC',
      },
    });

    const desiredDateSet = new Set(desiredTodoDates);
    const keptDateSet = new Set<string>();
    const todoIdsToDelete: string[] = [];
    const todoIdsToUpdate: string[] = [];

    for (const todo of futureTodos) {
      if (!desiredDateSet.has(todo.todoDate)) {
        todoIdsToDelete.push(todo.todoId);
        continue;
      }

      if (keptDateSet.has(todo.todoDate)) {
        // 동일 날짜에 중복 생성된 루틴 투두가 있으면 1건만 유지한다.
        todoIdsToDelete.push(todo.todoId);
        continue;
      }

      keptDateSet.add(todo.todoDate);
      desiredDateSet.delete(todo.todoDate);

      if (todo.ctgId !== ctgId || todo.content !== rtnContent) {
        todoIdsToUpdate.push(todo.todoId);
      }
    }

    if (todoIdsToDelete.length > 0) {
      await manager
        .createQueryBuilder()
        .update(TodoEntity)
        .set({
          isDeleted: true,
          deletedAt: () => 'NOW()',
        })
        .where('todo_id IN (:...todoIdsToDelete)', { todoIdsToDelete })
        .andWhere('usr_id = :usrId', { usrId })
        .andWhere('rtn_id = :rtnId', { rtnId })
        .andWhere('is_deleted = false')
        .execute();
    }

    if (todoIdsToUpdate.length > 0) {
      await manager
        .createQueryBuilder()
        .update(TodoEntity)
        .set({
          ctgId,
          content: rtnContent,
        })
        .where('todo_id IN (:...todoIdsToUpdate)', { todoIdsToUpdate })
        .andWhere('usr_id = :usrId', { usrId })
        .andWhere('rtn_id = :rtnId', { rtnId })
        .andWhere('is_deleted = false')
        .execute();
    }

    const datesToCreate = [...desiredDateSet].sort();
    if (datesToCreate.length > 0) {
      await this.createRoutineTodosWithManager(
        manager,
        usrId,
        ctgId,
        rtnId,
        rtnContent,
        datesToCreate,
      );
    }
  }

  /** @description 루틴 반복 설정을 현재 조건으로 교체 */
  private async replaceRoutineRepeatsWithManager(
    manager: EntityManager,
    rtnId: string,
    rptTypeCd: RptType,
    dayOfWeeks: number[],
    dayOfMths: number[],
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(RtnRptEntity)
      .set({ isDeleted: true })
      .where('rtn_id = :rtnId', { rtnId })
      .andWhere('is_deleted = false')
      .execute();

    const normalizedRepeatOptions = normalizeRepeatOptions(
      dayOfWeeks,
      dayOfMths,
    );
    const repeats = buildRepeatSeeds(rptTypeCd, normalizedRepeatOptions).map(
      (seed) =>
        manager.create(RtnRptEntity, {
          rtnId,
          rptTypeCd: seed.rptTypeCd,
          dayOfWeek: seed.dayOfWeek,
          dayOfMth: seed.dayOfMth,
        }),
    );

    await manager.save(RtnRptEntity, repeats);
  }

  /** @description 루틴/반복설정/투두를 트랜잭션으로 생성 */
  async createWithTodos(
    params: CreateRoutineParams,
  ): Promise<CreateRoutineResult> {
    return this.repository.manager.transaction(async (manager) => {
      const rawRoutineSortOrder = await manager
        .createQueryBuilder(RtnEntity, 'rtn')
        .select('MAX(rtn.sort_order)', 'maxSortOrder')
        .where('rtn.usr_id = :usrId', { usrId: params.usrId })
        .andWhere('rtn.ctg_id = :ctgId', { ctgId: params.ctgId })
        .andWhere('rtn.is_deleted = false')
        .getRawOne<{ maxSortOrder: string | null }>();

      const nextRoutineSortOrder =
        rawRoutineSortOrder?.maxSortOrder !== null &&
        rawRoutineSortOrder?.maxSortOrder !== undefined
          ? Number(rawRoutineSortOrder.maxSortOrder) + 1
          : 0;

      const routine = manager.create(RtnEntity, {
        usrId: params.usrId,
        ctgId: params.ctgId,
        rtnContent: params.rtnContent,
        rptTypeCd: params.rptTypeCd,
        startDt: params.startDt,
        endDt: params.endDt,
        alarmTime: params.alarmTime,
        sortOrder: nextRoutineSortOrder,
      });

      const savedRoutine = await manager.save(RtnEntity, routine);

      await this.replaceRoutineRepeatsWithManager(
        manager,
        savedRoutine.rtnId,
        params.rptTypeCd,
        params.dayOfWeeks,
        params.dayOfMths,
      );
      await this.createRoutineTodosWithManager(
        manager,
        params.usrId,
        params.ctgId,
        savedRoutine.rtnId,
        params.rtnContent,
        params.todoDates,
      );

      const routineWithRepeats = await manager.findOne(RtnEntity, {
        where: {
          rtnId: savedRoutine.rtnId,
          isDeleted: false,
        },
        relations: {
          rtnRpts: true,
          ctg: true,
        },
      });

      return {
        rtn: routineWithRepeats ?? savedRoutine,
        createdTodoCount: params.todoDates.length,
      };
    });
  }

  /** @description 오늘 이후 루틴 설정을 수정하고 오늘 이후 투두를 diff 동기화 */
  async updateFromToday(
    params: UpdateRoutineParams,
  ): Promise<RtnEntity | null> {
    return this.repository.manager.transaction(async (manager) => {
      const routine = await manager.findOne(RtnEntity, {
        where: { rtnId: params.rtnId, usrId: params.usrId, isDeleted: false },
      });

      if (!routine) {
        return null;
      }
      const previousCtgId = routine.ctgId;

      routine.ctgId = params.ctgId;
      routine.rtnContent = params.rtnContent;
      routine.rptTypeCd = params.rptTypeCd;
      routine.startDt = params.startDt;
      routine.endDt = params.endDt;
      routine.alarmTime = params.alarmTime;

      if (previousCtgId !== params.ctgId) {
        const rawRoutineSortOrder = await manager
          .createQueryBuilder(RtnEntity, 'rtn')
          .select('MAX(rtn.sort_order)', 'maxSortOrder')
          .where('rtn.usr_id = :usrId', { usrId: params.usrId })
          .andWhere('rtn.ctg_id = :ctgId', { ctgId: params.ctgId })
          .andWhere('rtn.is_deleted = false')
          .getRawOne<{ maxSortOrder: string | null }>();

        routine.sortOrder =
          rawRoutineSortOrder?.maxSortOrder !== null &&
          rawRoutineSortOrder?.maxSortOrder !== undefined
            ? Number(rawRoutineSortOrder.maxSortOrder) + 1
            : 0;
      }

      await manager.save(RtnEntity, routine);

      await this.replaceRoutineRepeatsWithManager(
        manager,
        routine.rtnId,
        params.rptTypeCd,
        params.dayOfWeeks,
        params.dayOfMths,
      );

      await this.syncRoutineTodosFromTodayWithManager(
        manager,
        params.usrId,
        params.rtnId,
        params.ctgId,
        params.rtnContent,
        params.todayDate,
        params.todoDatesFromToday,
      );

      const updatedRoutine = await manager
        .createQueryBuilder(RtnEntity, 'rtn')
        .leftJoinAndSelect('rtn.rtnRpts', 'rpt', 'rpt.is_deleted = false')
        .where('rtn.rtn_id = :rtnId', { rtnId: routine.rtnId })
        .andWhere('rtn.is_deleted = false')
        .orderBy('rpt.day_of_week', 'ASC')
        .addOrderBy('rpt.day_of_mth', 'ASC')
        .getOne();

      return updatedRoutine ?? null;
    });
  }

  /** @description 오늘 이후 투두를 삭제하고 루틴을 소프트 삭제 */
  async deleteFromToday(
    rtnId: string,
    usrId: string,
    todayDate: string,
  ): Promise<boolean> {
    return this.repository.manager.transaction(async (manager) => {
      const deleteRoutineResult = await manager
        .createQueryBuilder()
        .update(RtnEntity)
        .set({ isDeleted: true })
        .where('rtn_id = :rtnId', { rtnId })
        .andWhere('usr_id = :usrId', { usrId })
        .andWhere('is_deleted = false')
        .execute();

      if ((deleteRoutineResult.affected ?? 0) === 0) {
        return false;
      }

      await manager
        .createQueryBuilder()
        .update(RtnRptEntity)
        .set({ isDeleted: true })
        .where('rtn_id = :rtnId', { rtnId })
        .andWhere('is_deleted = false')
        .execute();

      await manager
        .createQueryBuilder()
        .update(TodoEntity)
        .set({
          isDeleted: true,
          deletedAt: () => 'NOW()',
        })
        .where('rtn_id = :rtnId', { rtnId })
        .andWhere('usr_id = :usrId', { usrId })
        .andWhere('todo_date >= :todayDate', { todayDate })
        .andWhere('is_deleted = false')
        .execute();

      return true;
    });
  }

  /** @description 사용자/카테고리 조건으로 활성 루틴 목록을 조회 */
  findAllByUserAndCategory(usrId: string, ctgId: string): Promise<RtnEntity[]> {
    return this.repository.find({
      where: {
        usrId,
        ctgId,
        isDeleted: false,
      },
      order: {
        sortOrder: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  /** @description 루틴 엔티티 배열을 일괄 저장 */
  saveMany(routines: RtnEntity[]): Promise<RtnEntity[]> {
    return this.repository.save(routines);
  }

  /** @description 사용자 활성 루틴 목록(반복 설정 포함)을 조회 */
  findAllByUser(usrId: string): Promise<RtnEntity[]> {
    return this.repository
      .createQueryBuilder('rtn')
      .leftJoinAndSelect('rtn.rtnRpts', 'rpt', 'rpt.is_deleted = false')
      .where('rtn.usr_id = :usrId', { usrId })
      .andWhere('rtn.is_deleted = false')
      .orderBy('rtn.sort_order', 'ASC')
      .addOrderBy('rtn.created_at', 'ASC')
      .addOrderBy('rpt.day_of_week', 'ASC')
      .addOrderBy('rpt.day_of_mth', 'ASC')
      .getMany();
  }
}
