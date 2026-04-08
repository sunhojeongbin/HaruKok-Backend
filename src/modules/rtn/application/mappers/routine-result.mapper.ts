import { formatRoutineAlarmTime } from '../../domain/policies/routine-alarm-time.policy';
import { RtnEntity } from '../../entities/rtn.entity';
import {
  RoutineCreateItem,
  RoutineListItem,
  RoutineRepeatItem,
} from '../types/routine.type';

function toRoutineRepeatItem(repeat: {
  rtnRptId: string;
  rptTypeCd: RoutineRepeatItem['rptTypeCd'];
  dayOfWeek: number | null;
  dayOfMth: number | null;
}): RoutineRepeatItem {
  return {
    rtnRptId: repeat.rtnRptId,
    rptTypeCd: repeat.rptTypeCd,
    dayOfWeek: repeat.dayOfWeek,
    dayOfMth: repeat.dayOfMth,
  };
}

/** @description 루틴 엔티티를 루틴 목록 응답 객체로 변환한다. */
export function toRoutineListItem(routine: RtnEntity): RoutineListItem {
  return {
    rtnId: routine.rtnId,
    usrId: routine.usrId,
    ctgId: routine.ctgId,
    rtnContent: routine.rtnContent,
    rptTypeCd: routine.rptTypeCd,
    startDt: routine.startDt,
    endDt: routine.endDt,
    alarmTime: formatRoutineAlarmTime(routine.alarmTime),
    sortOrder: routine.sortOrder,
    createdAt: routine.createdAt,
    updatedAt: routine.updatedAt,
    repeats: (routine.rtnRpts ?? []).map((repeat) =>
      toRoutineRepeatItem(repeat),
    ),
  };
}

/** @description 루틴 엔티티를 루틴 생성 응답 객체로 변환한다. */
export function toRoutineCreateItem(routine: RtnEntity): RoutineCreateItem {
  return {
    ...toRoutineListItem(routine),
    ctgColorCode: routine.ctg?.colorCode ?? null,
  };
}
