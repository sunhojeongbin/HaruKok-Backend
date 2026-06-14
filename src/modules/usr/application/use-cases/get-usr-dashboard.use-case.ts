import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { AuthResponse } from '../../../../common/response/auth.response';
import { UsrResponse } from '../../../../common/response/usr.response';
import { getTodayTodoDate } from '../../../todo/domain/policies/todo-date.policy';
import {
  USR_REPOSITORY,
  UsrRepositoryPort,
} from '../../repositories/usr.repository.port';
import { UsrDashboardResult } from '../types/usr-dashboard.type';

function resolveCurrentMonthRange(todayDt: string): {
  startDt: string;
  endDt: string;
} {
  const [yearText, monthText] = todayDt.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return {
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

function formatDisplayDate(isoDate: string): string {
  return isoDate.replace(/-/g, '. ');
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
    const monthRange = resolveCurrentMonthRange(todayDt);

    try {
      const metrics = await repo.getTodoDashboardMetrics({
        usrId: userId,
        monthStartDt: monthRange.startDt,
        monthEndDt: monthRange.endDt,
      });

      const completedTodoCnt = metrics.monthCompletedTodoCnt;
      const totalTodoCnt = metrics.monthTotalTodoCnt;
      const remainingTodoCnt = Math.max(totalTodoCnt - completedTodoCnt, 0);

      return {
        monthRange: {
          startDt: formatDisplayDate(monthRange.startDt),
          endDt: formatDisplayDate(monthRange.endDt),
        },
        monthTodoSummary: {
          todoCompletionRate: calculatePercentage(
            completedTodoCnt,
            totalTodoCnt,
          ),
          completedTodoCnt,
          remainingTodoCnt,
          totalTodoCnt,
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
