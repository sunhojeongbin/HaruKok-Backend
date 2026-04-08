import { RptType } from '../../enums/rpt-type.enum';

export type CreateRoutineInput = {
  ctgId: string;
  rtnContent: string;
  startDt: string;
  endDt: string;
  rptTypeCd: RptType;
  dayOfWeeks?: number[];
  dayOfMths?: number[];
  alarmTime?: string;
};

export type UpdateRoutineInput = {
  ctgId?: string;
  rtnContent?: string;
  startDt?: string;
  endDt?: string;
  rptTypeCd?: RptType;
  dayOfWeeks?: number[];
  dayOfMths?: number[];
  alarmTime?: string;
};

export type ReorderRoutineInput = {
  ctgId: string;
  rtnIds: string[];
};

/** @description 루틴 반복 설정 응답 데이터 형식 */
export type RoutineRepeatItem = {
  rtnRptId: string;
  rptTypeCd: RptType;
  dayOfWeek: number | null;
  dayOfMth: number | null;
};

/** @description 루틴 목록 응답 데이터 형식 */
export type RoutineListItem = {
  rtnId: string;
  usrId: string;
  ctgId: string;
  rtnContent: string;
  rptTypeCd: RptType;
  startDt: string;
  endDt: string;
  alarmTime: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  repeats: RoutineRepeatItem[];
};

/** @description 루틴 생성 응답 데이터 형식 */
export type RoutineCreateItem = RoutineListItem & {
  ctgColorCode: string | null;
};

/** @description 루틴 생성 결과 데이터 형식 */
export type RoutineCreateResult = RoutineCreateItem & {
  createdTodoCount: number;
};

/** @description 루틴 삭제 응답 데이터 형식 */
export type RoutineDeleteResult = {
  rtnId: string;
};

/** @description 루틴 순서 변경 응답 데이터 형식 */
export type RoutineOrderItem = {
  rtnId: string;
  sortOrder: number;
};
