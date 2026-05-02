import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RtnRptEntity } from '../../rtn/entities/rtn-rpt.entity';
import { RtnEntity } from '../../rtn/entities/rtn.entity';
import { TodoEntity } from '../../todo/entities/todo.entity';
import { FriendStatusCode, UsrFrdEntity } from '../entities/usr-frd.entity';
import { UsrSocialEntity } from '../entities/usr-social.entity';
import { TodoDashboardMetrics } from '../application/types/usr-dashboard.type';
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

  /** @description 사용자 기준 수락된 친구 수를 반환 (양방향 중복 제거) */
  async countAcceptedFrds(userId: string): Promise<number> {
    if (!this.repository) {
      return 0;
    }

    const raw = await this.repository.manager
      .createQueryBuilder(UsrFrdEntity, 'frd')
      .select(
        `COUNT(DISTINCT CASE WHEN frd.usr_id = :userId THEN frd.frd_usr_id ELSE frd.usr_id END)`,
        'friendCount',
      )
      .where('frd.is_deleted = false')
      .andWhere('frd.frd_stat_cd = :status', {
        status: FriendStatusCode.ACCEPTED,
      })
      .andWhere('(frd.usr_id = :userId OR frd.frd_usr_id = :userId)', {
        userId,
      })
      .getRawOne<{ friendCount: string | null }>();

    return Number(raw?.friendCount ?? 0);
  }

  /** @description 사용자 대시보드용 투두 지표를 조회 */
  async getTodoDashboardMetrics(params: {
    usrId: string;
    monthStartDt: string;
    monthEndDt: string;
    todayDt: string;
    yesterdayDt: string;
  }): Promise<TodoDashboardMetrics> {
    if (!this.repository) {
      return {
        monthCompletedTodoCnt: 0,
        monthTotalTodoCnt: 0,
        activeDayCnt: 0,
        perfectTodoDates: [],
        todayCompletionRate: 0,
        yesterdayCompletionRate: 0,
      };
    }

    const monthRaw = await this.repository.manager
      .createQueryBuilder(TodoEntity, 'todo')
      .select('COUNT(*)', 'totalTodoCnt')
      .addSelect(
        'COALESCE(SUM(CASE WHEN todo.is_completed THEN 1 ELSE 0 END), 0)',
        'completedTodoCnt',
      )
      .where('todo.usr_id = :usrId', { usrId: params.usrId })
      .andWhere('todo.is_deleted = false')
      .andWhere('todo.todo_date BETWEEN :monthStartDt AND :monthEndDt', {
        monthStartDt: params.monthStartDt,
        monthEndDt: params.monthEndDt,
      })
      .getRawOne<{
        totalTodoCnt: string | null;
        completedTodoCnt: string | null;
      }>();

    const activeDayRaw = await this.repository.manager
      .createQueryBuilder(TodoEntity, 'todo')
      .select('COUNT(DISTINCT todo.todo_date)', 'activeDayCnt')
      .where('todo.usr_id = :usrId', { usrId: params.usrId })
      .andWhere('todo.is_deleted = false')
      .getRawOne<{ activeDayCnt: string | null }>();

    const perfectRows = await this.repository.manager
      .createQueryBuilder(TodoEntity, 'todo')
      .select('todo.todo_date', 'todoDate')
      .where('todo.usr_id = :usrId', { usrId: params.usrId })
      .andWhere('todo.is_deleted = false')
      .groupBy('todo.todo_date')
      .having(
        'COUNT(*) = COALESCE(SUM(CASE WHEN todo.is_completed THEN 1 ELSE 0 END), 0)',
      )
      .getRawMany<{ todoDate: string }>();

    const dailyRows = await this.repository.manager
      .createQueryBuilder(TodoEntity, 'todo')
      .select('todo.todo_date', 'todoDate')
      .addSelect('COUNT(*)', 'totalTodoCnt')
      .addSelect(
        'COALESCE(SUM(CASE WHEN todo.is_completed THEN 1 ELSE 0 END), 0)',
        'completedTodoCnt',
      )
      .where('todo.usr_id = :usrId', { usrId: params.usrId })
      .andWhere('todo.is_deleted = false')
      .andWhere('todo.todo_date IN (:...targetDates)', {
        targetDates: [params.todayDt, params.yesterdayDt],
      })
      .groupBy('todo.todo_date')
      .getRawMany<{
        todoDate: string;
        totalTodoCnt: string | null;
        completedTodoCnt: string | null;
      }>();

    const dailyMap = new Map(
      dailyRows.map((row) => {
        const total = Number(row.totalTodoCnt ?? 0);
        const completed = Number(row.completedTodoCnt ?? 0);
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return [row.todoDate, rate] as const;
      }),
    );

    return {
      monthCompletedTodoCnt: Number(monthRaw?.completedTodoCnt ?? 0),
      monthTotalTodoCnt: Number(monthRaw?.totalTodoCnt ?? 0),
      activeDayCnt: Number(activeDayRaw?.activeDayCnt ?? 0),
      perfectTodoDates: perfectRows.map((row) => row.todoDate),
      todayCompletionRate: dailyMap.get(params.todayDt) ?? 0,
      yesterdayCompletionRate: dailyMap.get(params.yesterdayDt) ?? 0,
    };
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

  /** @description 사용자와 연관 데이터를 트랜잭션 내에서 하드 삭제 */
  async hardDeleteById(userId: string): Promise<void> {
    if (!this.repository) {
      throw new Error('UsrRepository is not initialized');
    }

    await this.repository.manager.transaction(async (manager) => {
      // 1. RTN_RPT (FK → RTN, NO ACTION)
      await manager
        .createQueryBuilder()
        .delete()
        .from(RtnRptEntity)
        .where(
          `rtn_id IN (SELECT rtn_id FROM "RTN" WHERE usr_id = :userId)`,
          { userId },
        )
        .execute();

      // 2. RTN (FK → USR, NO ACTION)
      await manager
        .createQueryBuilder()
        .delete()
        .from(RtnEntity)
        .where('usr_id = :userId', { userId })
        .execute();

      // 3. USR_SOCIAL (FK → USR, NO ACTION)
      await manager
        .createQueryBuilder()
        .delete()
        .from(UsrSocialEntity)
        .where('usr_id = :userId', { userId })
        .execute();

      // 4. USR_FRD (FK → USR on both sides, NO ACTION)
      await manager
        .createQueryBuilder()
        .delete()
        .from(UsrFrdEntity)
        .where('usr_id = :userId OR frd_usr_id = :userId', { userId })
        .execute();

      // 5. USR → CASCADE: CTG, TODO, RFT
      await manager
        .createQueryBuilder()
        .delete()
        .from(UsrEntity)
        .where('usr_id = :userId', { userId })
        .execute();
    });
  }
}
