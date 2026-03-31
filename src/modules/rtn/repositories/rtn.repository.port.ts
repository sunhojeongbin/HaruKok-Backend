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

/** @description 루틴 생성 결과 */
export type CreateRoutineResult = {
  rtn: RtnEntity;
  createdTodoCount: number;
};

/** @description 루틴 저장소 추상화 */
export interface RtnRepositoryPort {
  isCategoryOwnedByUser(usrId: string, ctgId: string): Promise<boolean>;

  createWithTodos(params: CreateRoutineParams): Promise<CreateRoutineResult>;

  findAllByUser(usrId: string): Promise<RtnEntity[]>;
}
