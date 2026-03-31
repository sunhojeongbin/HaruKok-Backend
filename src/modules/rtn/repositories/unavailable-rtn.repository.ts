import { Injectable } from '@nestjs/common';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { RtnResponse } from '../../../common/response/rtn.response';
import { RtnEntity } from '../entities/rtn.entity';
import {
  CreateRoutineParams,
  CreateRoutineResult,
  RtnRepositoryPort,
} from './rtn.repository.port';

/** @description SKIP_DB 환경에서 사용하는 루틴 저장소 */
@Injectable()
export class UnavailableRtnRepository implements RtnRepositoryPort {
  private rejectRepositoryNotReady<T>(): Promise<T> {
    return Promise.reject(
      new BusinessException(RtnResponse.ROUTINE_REPOSITORY_NOT_READY),
    );
  }

  private consume(...args: unknown[]): void {
    void args;
  }

  isCategoryOwnedByUser(_usrId: string, _ctgId: string): Promise<boolean> {
    this.consume(_usrId, _ctgId);
    return this.rejectRepositoryNotReady();
  }

  createWithTodos(_params: CreateRoutineParams): Promise<CreateRoutineResult> {
    this.consume(_params);
    return this.rejectRepositoryNotReady();
  }

  findAllByUser(_usrId: string): Promise<RtnEntity[]> {
    this.consume(_usrId);
    return this.rejectRepositoryNotReady();
  }
}
