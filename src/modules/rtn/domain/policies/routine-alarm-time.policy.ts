export const ROUTINE_ALARM_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** @description 루틴 알림 시간을 정규화한다. */
export function normalizeRoutineAlarmTime(
  alarmTime?: string | null,
): string | null {
  if (alarmTime === undefined || alarmTime === null) {
    return null;
  }

  const normalizedAlarmTime = alarmTime.trim();
  if (!normalizedAlarmTime) {
    return null;
  }

  return normalizedAlarmTime;
}

/** @description 루틴 알림 시간을 응답 형식(HH:mm)으로 변환한다. */
export function formatRoutineAlarmTime(
  alarmTime: string | null,
): string | null {
  if (!alarmTime) {
    return null;
  }

  const trimmedAlarmTime = alarmTime.trim();
  if (!trimmedAlarmTime) {
    return null;
  }

  return trimmedAlarmTime.length >= 5
    ? trimmedAlarmTime.slice(0, 5)
    : trimmedAlarmTime;
}
