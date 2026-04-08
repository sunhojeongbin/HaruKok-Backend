export const ROUTINE_DATE_PATTERN =
  /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const ROUTINE_BUSINESS_TIMEZONE = 'Asia/Seoul';

type RoutineTodayDateOptions = {
  now?: Date;
  timeZone?: string;
};

/** @description 오늘 날짜를 비즈니스 타임존 기준 YYYY-MM-DD 형식으로 반환한다. */
export function getTodayRoutineDate(
  options: RoutineTodayDateOptions = {},
): string {
  const now = options.now ?? new Date();
  const timeZone = options.timeZone ?? ROUTINE_BUSINESS_TIMEZONE;
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = dateParts.find((part) => part.type === 'year')?.value ?? '0000';
  const month = dateParts.find((part) => part.type === 'month')?.value ?? '01';
  const day = dateParts.find((part) => part.type === 'day')?.value ?? '01';
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
