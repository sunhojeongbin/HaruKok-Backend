import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  TODO_REPOSITORY,
  TodoRepositoryPort,
} from '../../../todo/application/ports/todo.repository.port';
import { TodoEntity } from '../../../todo/entities/todo.entity';
import {
  buildDailySummaryPayload,
  getTodayDateInKst,
} from '../policies/daily-summary.policy';
import {
  NTF_TOKEN_REPOSITORY,
  NtfTokenRepositoryPort,
} from '../ports/ntf-token.repository.port';
import { PUSH_SENDER, PushSenderPort } from '../ports/push-sender.port';

/** @description 일일 요약 발송 결과 리포트 */
export type DailySummaryReport = {
  targetedUsers: number;
  sentUsers: number;
};

/**
 * @description 활성 토큰을 가진 모든 사용자에게 오늘의 투두 요약 푸시를 발송한다.
 *              스케줄러가 정해진 시각에 호출한다.
 */
@Injectable()
export class SendDailyTodoSummaryUseCase {
  private readonly logger = new Logger(SendDailyTodoSummaryUseCase.name);

  constructor(
    @Inject(NTF_TOKEN_REPOSITORY)
    private readonly ntfTokenRepository: NtfTokenRepositoryPort,
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepositoryPort,
    @Inject(PUSH_SENDER)
    private readonly pushSender: PushSenderPort,
  ) {}

  async execute(): Promise<DailySummaryReport> {
    const activeTokens = await this.ntfTokenRepository.findAllActiveTokens();
    if (activeTokens.length === 0) {
      return { targetedUsers: 0, sentUsers: 0 };
    }

    const tokensByUser = new Map<string, string[]>();
    for (const row of activeTokens) {
      const tokens = tokensByUser.get(row.usrId) ?? [];
      tokens.push(row.fcmToken);
      tokensByUser.set(row.usrId, tokens);
    }

    const usrIds = [...tokensByUser.keys()];
    const date = getTodayDateInKst();
    const todos = await this.todoRepository.findTodayByUsers(usrIds, date);

    const todosByUser = new Map<string, TodoEntity[]>();
    for (const todo of todos) {
      const list = todosByUser.get(todo.usrId) ?? [];
      list.push(todo);
      todosByUser.set(todo.usrId, list);
    }

    const invalidTokens: string[] = [];
    let sentUsers = 0;

    for (const usrId of usrIds) {
      const userTokens = tokensByUser.get(usrId) ?? [];
      if (userTokens.length === 0) {
        continue;
      }

      const payload = buildDailySummaryPayload(todosByUser.get(usrId) ?? []);

      try {
        const result = await this.pushSender.send(userTokens, payload);
        invalidTokens.push(...result.invalidTokens);
        sentUsers += 1;
      } catch (error) {
        // 한 사용자 발송 실패가 전체 배치를 막지 않도록 격리한다.
        this.logger.error(
          `일일 요약 푸시 발송 실패 (usrId=${usrId}): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    if (invalidTokens.length > 0) {
      await this.ntfTokenRepository.deactivateTokens(invalidTokens);
    }

    return { targetedUsers: usrIds.length, sentUsers };
  }
}
