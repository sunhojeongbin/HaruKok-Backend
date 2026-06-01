export const TODO_YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
export const TODO_DATE_PATTERN =
  /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** @description 오늘 날짜를 YYYY-MM-DD 형식으로 반환한다. */
export function getTodayTodoDate(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** @description 날짜 문자열(YYYY-MM-DD)이 실제 달력 날짜인지 확인한다. */
export function isValidTodoDateText(dateText: string): boolean {
  if (!TODO_DATE_PATTERN.test(dateText)) {
    return false;
  }

  const [year, month, day] = dateText.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
}

/** @description YYYY-MM-DD 날짜에 일 수를 더해 YYYY-MM-DD로 반환한다. */
export function addDaysToTodoDate(dateText: string, days: number): string {
  const [year, month, day] = dateText.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  const baseDate = new Date(Date.UTC(year, month - 1, day));
  baseDate.setUTCDate(baseDate.getUTCDate() + days);

  const nextYear = baseDate.getUTCFullYear();
  const nextMonth = String(baseDate.getUTCMonth() + 1).padStart(2, '0');
  const nextDay = String(baseDate.getUTCDate()).padStart(2, '0');
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

/** @description YYYY-MM-DD 날짜에서 월 수를 빼 YYYY-MM-DD로 반환한다(말일 보정). */
export function subtractMonthsFromTodoDate(
  dateText: string,
  months: number,
): string {
  const [year, month, day] = dateText.split('-').map(Number) as [
    number,
    number,
    number,
  ];

  const targetMonthBase = new Date(Date.UTC(year, month - 1 - months, 1));
  const targetYear = targetMonthBase.getUTCFullYear();
  const targetMonth = targetMonthBase.getUTCMonth() + 1;
  const targetMonthLastDay = new Date(
    Date.UTC(targetYear, targetMonth, 0),
  ).getUTCDate();
  const targetDay = Math.min(day, targetMonthLastDay);

  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
}

/** @description 오늘 기준 내일 날짜를 YYYY-MM-DD 형식으로 반환한다. */
export function getTomorrowTodoDate(): string {
  return addDaysToTodoDate(getTodayTodoDate(), 1);
}
