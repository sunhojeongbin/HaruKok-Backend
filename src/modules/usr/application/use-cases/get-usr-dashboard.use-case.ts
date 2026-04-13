import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { AuthResponse } from '../../../../common/response/auth.response';
import { UsrResponse } from '../../../../common/response/usr.response';
import {
  addDaysToTodoDate,
  getTodayTodoDate,
} from '../../../todo/domain/policies/todo-date.policy';
import {
  USR_REPOSITORY,
  UsrRepositoryPort,
} from '../../repositories/usr.repository.port';
import { UsrDashboardResult } from '../types/usr-dashboard.type';

function resolveCurrentMonthRange(todayDt: string): {
  yearMonth: string;
  startDt: string;
  endDt: string;
} {
  const [yearText, monthText] = todayDt.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return {
    yearMonth: `${yearText}-${monthText}`,
    startDt: `${yearText}-${monthText}-01`,
    endDt: `${yearText}-${monthText}-${String(lastDay).padStart(2, '0')}`,
  };
}

function calculatePercentage(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return Math.round((numerator / denominator) * 100);
}

function calculateStreakDayCnt(
  perfectTodoDateSet: Set<string>,
  todayDt: string,
): number {
  let streak = 0;
  let cursor = todayDt;

  while (perfectTodoDateSet.has(cursor)) {
    streak += 1;
    cursor = addDaysToTodoDate(cursor, -1);
  }

  return streak;
}

@Injectable()
export class GetUsrDashboardUseCase {
  constructor(
    @Inject(USR_REPOSITORY)
    private readonly usrRepository: UsrRepositoryPort,
  ) {}

  private getUsrRepository(): UsrRepositoryPort {
    if (!this.usrRepository.isReady()) {
      throw new BusinessException(AuthResponse.USER_REPOSITORY_NOT_READY);
    }
    return this.usrRepository;
  }

  async execute(userId: string): Promise<UsrDashboardResult> {
    const repo = this.getUsrRepository();
    const user = await repo.findActiveById(userId);
    if (!user) {
      throw new BusinessException(AuthResponse.USER_NOT_FOUND);
    }

    const todayDt = getTodayTodoDate();
    const yesterdayDt = addDaysToTodoDate(todayDt, -1);
    const monthRange = resolveCurrentMonthRange(todayDt);

    try {
      const frdCnt = await repo.countAcceptedFrds(userId);
      const metrics = await repo.getTodoDashboardMetrics({
        usrId: userId,
        monthStartDt: monthRange.startDt,
        monthEndDt: monthRange.endDt,
        todayDt,
        yesterdayDt,
      });

      const completedTodoCnt = metrics.monthCompletedTodoCnt;
      const totalTodoCnt = metrics.monthTotalTodoCnt;
      const remainingTodoCnt = Math.max(totalTodoCnt - completedTodoCnt, 0);

      const perfectTodoDateSet = new Set(metrics.perfectTodoDates);
      const streakDayCnt = calculateStreakDayCnt(perfectTodoDateSet, todayDt);
      const perfectDayCnt = metrics.perfectTodoDates.length;
      const avgTodoCompletionRateDiff =
        metrics.todayCompletionRate - metrics.yesterdayCompletionRate;

      return {
        usrSummary: {
          usrId: user.usrId,
          usrNm: user.usrNm,
          usrEmail: user.usrEmail ?? '',
          frdCnt,
        },
        monthRange,
        monthTodoSummary: {
          todoCompletionRate: calculatePercentage(
            completedTodoCnt,
            totalTodoCnt,
          ),
          completedTodoCnt,
          remainingTodoCnt,
          totalTodoCnt,
        },
        todoStatusSummary: {
          activeDayCnt: metrics.activeDayCnt,
          streakDayCnt,
          perfectDayCnt,
          dailyAvgTodoCompletionRate: metrics.todayCompletionRate,
          avgTodoCompletionRateDiff,
        },
      };
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException(UsrResponse.DASHBOARD_FETCH_FAILED);
    }
  }
}
