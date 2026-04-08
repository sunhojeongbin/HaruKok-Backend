export const ROUTINE_DATE_PATTERN =
  /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** @description 오늘 날짜를 YYYY-MM-DD 형식으로 반환한다. */
export function getTodayRoutineDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** @description 날짜 문자열(YYYY-MM-DD)이 실제 달력 날짜인지 확인한다. */
export function isValidRoutineDateText(dateText: string): boolean {
  if (!ROUTINE_DATE_PATTERN.test(dateText)) {
    return false;
  }

  const [year, month, day] = dateText.split('-').map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
}

/** @description YYYY-MM-DD 날짜에 일 수를 더해 YYYY-MM-DD로 반환한다. */
export function addDaysToRoutineDate(dateText: string, days: number): string {
  const [year, month, day] = dateText.split('-').map(Number);
  const baseDate = new Date(Date.UTC(year, month - 1, day));
  baseDate.setUTCDate(baseDate.getUTCDate() + days);

  const nextYear = baseDate.getUTCFullYear();
  const nextMonth = String(baseDate.getUTCMonth() + 1).padStart(2, '0');
  const nextDay = String(baseDate.getUTCDate()).padStart(2, '0');
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

/** @description 시작~종료(포함) 날짜 배열을 생성한다. */
export function buildRoutineDateRange(
  startDt: string,
  endDt: string,
): string[] {
  const dates: string[] = [];
  let cursor = startDt;

  while (cursor <= endDt) {
    dates.push(cursor);
    cursor = addDaysToRoutineDate(cursor, 1);
  }

  return dates;
}
