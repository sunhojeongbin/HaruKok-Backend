import { Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { RtnErrorCode } from '../../errors/rtn-error-code';
import { RtnEntity } from '../../entities/rtn.entity';
import {
  CreateRoutineParams,
  CreateRoutineResult,
  RtnRepositoryPort,
  UpdateRoutineParams,
} from '../../application/ports/rtn.repository.port';

/** @description SKIP_DB 환경에서 사용하는 루틴 저장소 */
@Injectable()
export class UnavailableRtnRepository implements RtnRepositoryPort {
  private rejectRepositoryNotReady<T>(): Promise<T> {
    return Promise.reject(
      new BusinessException(RtnErrorCode.ROUTINE_REPOSITORY_NOT_READY),
    );
  }

  private consume(...args: unknown[]): void {
    void args;
  }

  isCategoryOwnedByUser(_usrId: string, _ctgId: string): Promise<boolean> {
    this.consume(_usrId, _ctgId);
    return this.rejectRepositoryNotReady();
  }

  findByIdAndUser(_rtnId: string, _usrId: string): Promise<RtnEntity | null> {
    this.consume(_rtnId, _usrId);
    return this.rejectRepositoryNotReady();
  }

  createWithTodos(_params: CreateRoutineParams): Promise<CreateRoutineResult> {
    this.consume(_params);
    return this.rejectRepositoryNotReady();
  }

  updateFromToday(_params: UpdateRoutineParams): Promise<RtnEntity | null> {
    this.consume(_params);
    return this.rejectRepositoryNotReady();
  }

  deleteFromToday(
    _rtnId: string,
    _usrId: string,
    _todayDate: string,
  ): Promise<boolean> {
    this.consume(_rtnId, _usrId, _todayDate);
    return this.rejectRepositoryNotReady();
  }

  findAllByUserAndCategory(
    _usrId: string,
    _ctgId: string,
  ): Promise<RtnEntity[]> {
    this.consume(_usrId, _ctgId);
    return this.rejectRepositoryNotReady();
  }

  saveMany(_routines: RtnEntity[]): Promise<RtnEntity[]> {
    this.consume(_routines);
    return this.rejectRepositoryNotReady();
  }

  findAllByUser(_usrId: string): Promise<RtnEntity[]> {
    this.consume(_usrId);
    return this.rejectRepositoryNotReady();
  }
}
