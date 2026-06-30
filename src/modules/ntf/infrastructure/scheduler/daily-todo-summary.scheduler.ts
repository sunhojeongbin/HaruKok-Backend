import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { getDailySummaryHour } from '../../../../config/firebase.config';
import { SendDailyTodoSummaryUseCase } from '../../application/use-cases/send-daily-todo-summary.use-case';

const CRON_JOB_NAME = 'daily-todo-summary';

/**
 * @description 매일 정해진 시각(KST)에 오늘의 투두 요약 푸시를 발송하는 스케줄러.
 *              발송 시각은 PUSH_DAILY_SUMMARY_HOUR 환경변수로 제어한다.
 */
@Injectable()
export class DailyTodoSummaryScheduler implements OnModuleInit {
  private readonly logger = new Logger(DailyTodoSummaryScheduler.name);

  constructor(
    private readonly config: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly sendDailyTodoSummaryUseCase: SendDailyTodoSummaryUseCase,
  ) {}

  onModuleInit(): void {
    const hour = getDailySummaryHour(this.config);
    const cronExpression = `0 0 ${hour} * * *`;

    const job = new CronJob(
      cronExpression,
      () => {
        void this.runDailySummary();
      },
      null,
      false,
      'Asia/Seoul',
    );

    this.schedulerRegistry.addCronJob(CRON_JOB_NAME, job);
    job.start();

    this.logger.log(
      `일일 투두 요약 푸시 스케줄 등록 완료 (매일 ${hour}시, KST)`,
    );
  }

  private async runDailySummary(): Promise<void> {
    try {
      const report = await this.sendDailyTodoSummaryUseCase.execute();
      this.logger.log(
        `일일 요약 발송 완료: ${report.sentUsers}/${report.targetedUsers}명`,
      );
    } catch (error) {
      this.logger.error(
        `일일 요약 발송 실패: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
