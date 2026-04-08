import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { getTodayRoutineDate } from '../../domain/policies/routine-date.policy';
import { RtnErrorCode } from '../../errors/rtn-error-code';
import { throwRoutinePersistenceException } from '../policies/routine-persistence-error.policy';
import {
  RTN_REPOSITORY,
  RtnRepositoryPort,
} from '../ports/rtn.repository.port';
import { RoutineDeleteResult } from '../types/routine.type';

@Injectable()
export class DeleteRtnUseCase {
  constructor(
    @Inject(RTN_REPOSITORY)
    private readonly rtnRepository: RtnRepositoryPort,
  ) {}

  async execute(userId: string, rtnId: string): Promise<RoutineDeleteResult> {
    const routine = await this.rtnRepository.findByIdAndUser(rtnId, userId);
    if (!routine) {
      throw new BusinessException(RtnErrorCode.ROUTINE_NOT_FOUND);
    }

    try {
      const isDeleted = await this.rtnRepository.deleteFromToday(
        rtnId,
        userId,
        getTodayRoutineDate(),
      );
      if (!isDeleted) {
        throw new BusinessException(RtnErrorCode.ROUTINE_NOT_FOUND);
      }

      return { rtnId };
    } catch (error) {
      throwRoutinePersistenceException(
        error,
        RtnErrorCode.ROUTINE_DELETE_FAILED,
      );
    }
  }
}
