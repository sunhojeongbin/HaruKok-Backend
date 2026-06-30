import { TodoEntity } from '../../../todo/entities/todo.entity';
import { PushPayload } from '../ports/push-sender.port';

/** @description 본문에 나열하는 투두 제목 최대 개수 */
export const DAILY_SUMMARY_MAX_ITEMS = 5;

/** @description 오늘 날짜(KST 기준)를 YYYY-MM-DD 형식으로 반환한다. */
export function getTodayDateInKst(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getUTCFullYear();
  const month = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kst.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * @description 오늘 투두 목록으로 일일 요약 푸시 페이로드를 만든다.
 *              남은(미완료) 투두가 없으면 "오늘 남은 할 일이 없어요",
 *              있으면 개수와 제목 목록을 안내한다.
 */
export function buildDailySummaryPayload(todos: TodoEntity[]): PushPayload {
  const remaining = todos.filter((todo) => !todo.isCompleted);

  if (remaining.length === 0) {
    return {
      title: '하루콕',
      body: '오늘 남은 할 일이 없어요',
    };
  }

  const shownTitles = remaining
    .slice(0, DAILY_SUMMARY_MAX_ITEMS)
    .map((todo) => `- ${todo.content}`);

  const hiddenCount = remaining.length - shownTitles.length;
  if (hiddenCount > 0) {
    shownTitles.push(`…외 ${hiddenCount}개`);
  }

  return {
    title: `오늘 할 일이 ${remaining.length}개 남았어요`,
    body: shownTitles.join('\n'),
  };
}
