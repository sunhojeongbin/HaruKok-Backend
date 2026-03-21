import { Injectable } from '@nestjs/common';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { CtgResponse } from '../../../common/response/ctg.response';
import { CtgEntity } from '../entities/ctg.entity';
import {
  CreateCategoryWithLimitParams,
  CtgRepositoryPort,
} from './ctg.repository.port';

/** @description SKIP_DB 환경에서 사용하는 카테고리 저장소 */
@Injectable()
export class UnavailableCtgRepository implements CtgRepositoryPort {
  private rejectRepositoryNotReady<T>(): Promise<T> {
    return Promise.reject(
      new BusinessException(CtgResponse.CATEGORY_REPOSITORY_NOT_READY),
    );
  }

  private consume(...args: unknown[]): void {
    void args;
  }

  findByUserAndName(
    _usrId: string,
    _ctgName: string,
    _excludeCtgId?: string,
  ): Promise<CtgEntity | null> {
    this.consume(_usrId, _ctgName, _excludeCtgId);
    return this.rejectRepositoryNotReady();
  }

  findByIdAndUser(_ctgId: string, _usrId: string): Promise<CtgEntity | null> {
    this.consume(_ctgId, _usrId);
    return this.rejectRepositoryNotReady();
  }

  findAllByUser(_usrId: string): Promise<CtgEntity[]> {
    this.consume(_usrId);
    return this.rejectRepositoryNotReady();
  }

  createWithUserLimit(
    _params: CreateCategoryWithLimitParams,
    _maxCategoryCount: number,
  ): Promise<CtgEntity | null> {
    this.consume(_params, _maxCategoryCount);
    return this.rejectRepositoryNotReady();
  }

  save(_category: CtgEntity): Promise<CtgEntity> {
    this.consume(_category);
    return this.rejectRepositoryNotReady();
  }

  saveMany(_categories: CtgEntity[]): Promise<CtgEntity[]> {
    this.consume(_categories);
    return this.rejectRepositoryNotReady();
  }

  softDeleteAndReindex(_category: CtgEntity, _usrId: string): Promise<void> {
    this.consume(_category, _usrId);
    return this.rejectRepositoryNotReady();
  }
}
