import { BusinessException } from '../../../../common/exceptions/business.exception';
import { TodoErrorCode } from '../../errors/todo-error-code';
import {
  getTodayTodoDate,
  isValidTodoDateText,
  subtractMonthsFromTodoDate,
  TODO_YEAR_MONTH_PATTERN,
} from '../../domain/policies/todo-date.policy';
import {
  normalizeTodoContent,
  normalizeTodoMemo,
  normalizeTodoSearchKeyword,
} from '../../domain/policies/todo-text.policy';

const MAX_CONTENT_LENGTH = 255;
const MAX_MEMO_LENGTH = 1000;
const MAX_SEARCH_KEYWORD_LENGTH = 255;

/** @description 할 일 내용을 정규화하고 검증한다. */
export function validateTodoContent(content: string): string {
  const normalizedContent = normalizeTodoContent(content);
  if (!normalizedContent || normalizedContent.length > MAX_CONTENT_LENGTH) {
    throw new BusinessException(TodoErrorCode.TODO_CONTENT_INVALID);
  }
  return normalizedContent;
}

/** @description 메모를 정규화하고 검증한다. */
export function validateTodoMemo(memo?: string): string | null {
  const normalizedMemo = normalizeTodoMemo(memo);
  if (normalizedMemo && normalizedMemo.length > MAX_MEMO_LENGTH) {
    throw new BusinessException(TodoErrorCode.TODO_MEMO_INVALID);
  }
  return normalizedMemo;
}

/** @description 검색 키워드를 정규화하고 검증한다. */
export function validateTodoSearchKeyword(keyword: string): string {
  const normalizedKeyword = normalizeTodoSearchKeyword(keyword);
  if (
    !normalizedKeyword ||
    normalizedKeyword.length > MAX_SEARCH_KEYWORD_LENGTH
  ) {
    throw new BusinessException(TodoErrorCode.TODO_SEARCH_KEYWORD_INVALID);
  }
  return normalizedKeyword;
}

/** @description 투두 날짜 문자열을 검증한다. */
export function validateTodoDate(dateText: string): void {
  if (!isValidTodoDateText(dateText)) {
    throw new BusinessException(TodoErrorCode.TODO_DATE_INVALID);
  }
}

/** @description 투두 반복 대상 날짜 배열을 검증한다. */
export function validateTodoRepeatDates(
  dates: string[],
  sourceTodoDate: string,
): void {
  const hasInvalidDate = dates.some(
    (dateText) => !isValidTodoDateText(dateText),
  );
  if (hasInvalidDate) {
    throw new BusinessException(TodoErrorCode.TODO_REPEAT_DATE_INVALID);
  }

  const hasSameDateAsSource = dates.some(
    (dateText) => dateText === sourceTodoDate,
  );
  if (hasSameDateAsSource) {
    throw new BusinessException(
      TodoErrorCode.TODO_REPEAT_TARGET_SAME_AS_SOURCE,
    );
  }
}

/** @description YYYY-MM을 월 시작/종료일로 변환한다. */
export function resolveTodoMonthRange(yearMonth?: string): {
  startDate: string;
  endDate: string;
} {
  let year: number;
  let month: number;

  if (yearMonth) {
    if (!TODO_YEAR_MONTH_PATTERN.test(yearMonth)) {
      throw new BusinessException(TodoErrorCode.TODO_QUERY_MONTH_INVALID);
    }
    const [parsedYear, parsedMonth] = yearMonth.split('-').map(Number);
    year = parsedYear;
    month = parsedMonth;
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  const monthText = String(month).padStart(2, '0');
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lastDayText = String(lastDay).padStart(2, '0');

  return {
    startDate: `${year}-${monthText}-01`,
    endDate: `${year}-${monthText}-${lastDayText}`,
  };
}

/** @description 오늘 기준 직전 3개월 ~ 오늘 기간을 반환한다. */
export function resolveTodoSearchRange(): {
  startDate: string;
  endDate: string;
} {
  const endDate = getTodayTodoDate();
  const startDate = subtractMonthsFromTodoDate(endDate, 3);
  return { startDate, endDate };
}
