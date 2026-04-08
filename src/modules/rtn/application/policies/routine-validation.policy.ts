import { BusinessException } from '../../../../common/exceptions/business.exception';
import {
  RepeatOptions,
  normalizeRepeatOptions,
  resolveTodoDatesByRepeat,
  validateRepeatOptions,
} from '../../domain/policies/routine-repeat.policy';
import { RptType } from '../../enums/rpt-type.enum';
import { RtnEntity } from '../../entities/rtn.entity';
import { RtnErrorCode } from '../../errors/rtn-error-code';
import {
  ROUTINE_ALARM_TIME_PATTERN,
  normalizeRoutineAlarmTime,
} from '../../domain/policies/routine-alarm-time.policy';
import {
  buildRoutineDateRange,
  isValidRoutineDateText,
} from '../../domain/policies/routine-date.policy';
import { normalizeRoutineContent } from '../../domain/policies/routine-text.policy';

const MAX_ROUTINE_CONTENT_LENGTH = 100;

/** @description 루틴 내용을 정규화하고 검증한다. */
export function validateRoutineContent(content: string): string {
  const normalizedContent = normalizeRoutineContent(content);
  if (
    !normalizedContent ||
    normalizedContent.length > MAX_ROUTINE_CONTENT_LENGTH
  ) {
    throw new BusinessException(RtnErrorCode.ROUTINE_NAME_INVALID);
  }
  return normalizedContent;
}

/** @description 루틴 시작/종료 날짜를 검증한다. */
export function validateRoutineDateRange(startDt: string, endDt: string): void {
  if (!isValidRoutineDateText(startDt) || !isValidRoutineDateText(endDt)) {
    throw new BusinessException(RtnErrorCode.ROUTINE_DATE_INVALID);
  }
  if (endDt < startDt) {
    throw new BusinessException(RtnErrorCode.ROUTINE_DATE_RANGE_INVALID);
  }
}

/** @description 루틴 알림 시간을 정규화하고 검증한다. */
export function validateRoutineAlarmTime(alarmTime?: string): string | null {
  const normalizedAlarmTime = normalizeRoutineAlarmTime(alarmTime);
  if (
    normalizedAlarmTime &&
    !ROUTINE_ALARM_TIME_PATTERN.test(normalizedAlarmTime)
  ) {
    throw new BusinessException(RtnErrorCode.ROUTINE_ALARM_TIME_INVALID);
  }
  return normalizedAlarmTime;
}

/** @description 반복 옵션을 정규화하고 검증한다. */
export function validateRoutineRepeatOptions(
  rptTypeCd: RptType,
  dayOfWeeks?: number[],
  dayOfMths?: number[],
): RepeatOptions {
  const repeatOptions = normalizeRepeatOptions(dayOfWeeks, dayOfMths);
  const repeatOptionsError = validateRepeatOptions(rptTypeCd, repeatOptions);
  if (repeatOptionsError) {
    throw new BusinessException(repeatOptionsError);
  }
  return repeatOptions;
}

/** @description 반복 조건으로 생성할 날짜를 계산한다. */
export function resolveRoutineTodoDatesByRepeat(
  startDt: string,
  endDt: string,
  rptTypeCd: RptType,
  repeatOptions: RepeatOptions,
): string[] {
  return resolveTodoDatesByRepeat(
    buildRoutineDateRange(startDt, endDt),
    rptTypeCd,
    repeatOptions,
  );
}

/** @description 생성 시 반복 조건으로 생성할 날짜를 계산하고 비어있지 않은지 검증한다. */
export function resolveRoutineTodoDatesForCreate(
  startDt: string,
  endDt: string,
  rptTypeCd: RptType,
  repeatOptions: RepeatOptions,
): string[] {
  const todoDates = resolveRoutineTodoDatesByRepeat(
    startDt,
    endDt,
    rptTypeCd,
    repeatOptions,
  );
  if (todoDates.length === 0) {
    throw new BusinessException(RtnErrorCode.ROUTINE_TODO_DATES_EMPTY);
  }
  return todoDates;
}

/** @description 루틴 엔티티에서 현재 반복 옵션을 추출한다. */
export function extractRoutineRepeatOptions(routine: RtnEntity): RepeatOptions {
  const dayOfWeeks = [
    ...new Set(
      (routine.rtnRpts ?? [])
        .map((repeat) => repeat.dayOfWeek)
        .filter((day): day is number => day !== null),
    ),
  ];
  const dayOfMths = [
    ...new Set(
      (routine.rtnRpts ?? [])
        .map((repeat) => repeat.dayOfMth)
        .filter((day): day is number => day !== null),
    ),
  ];

  return { dayOfWeeks, dayOfMths };
}
