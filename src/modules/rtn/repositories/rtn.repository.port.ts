import { RtnEntity } from '../entities/rtn.entity';
import { RptType } from '../enums/rpt-type.enum';

export const RTN_REPOSITORY = Symbol('RTN_REPOSITORY');

/** @description 루틴 생성 파라미터 */
export type CreateRoutineParams = {
  usrId: string;
  ctgId: string;
  rtnContent: string;
  rptTypeCd: RptType;
  startDt: string;
  endDt: string;
  alarmTime: string | null;
  dayOfWeeks: number[];
  dayOfMths: number[];
  todoDates: string[];
};

/** @description 루틴 수정 파라미터 */
export type UpdateRoutineParams = {
  usrId: string;
  rtnId: string;
  ctgId: string;
  rtnContent: string;
  rptTypeCd: RptType;
  startDt: string;
  endDt: string;
  alarmTime: string | null;
  dayOfWeeks: number[];
  dayOfMths: number[];
  todayDate: string;
  todoDatesFromToday: string[];
};

/** @description 루틴 생성 결과 */
export type CreateRoutineResult = {
  rtn: RtnEntity;
  createdTodoCount: number;
};

/** @description 루틴 저장소 추상화 */
export interface RtnRepositoryPort {
  isCategoryOwnedByUser(usrId: string, ctgId: string): Promise<boolean>;

  findByIdAndUser(rtnId: string, usrId: string): Promise<RtnEntity | null>;

  createWithTodos(params: CreateRoutineParams): Promise<CreateRoutineResult>;

  updateFromToday(params: UpdateRoutineParams): Promise<RtnEntity | null>;

  deleteFromToday(
    rtnId: string,
    usrId: string,
    todayDate: string,
  ): Promise<boolean>;

  findAllByUserAndCategory(usrId: string, ctgId: string): Promise<RtnEntity[]>;

  saveMany(routines: RtnEntity[]): Promise<RtnEntity[]>;

  findAllByUser(usrId: string): Promise<RtnEntity[]>;
}
