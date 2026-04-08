import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { RtnErrorCode } from '../../errors/rtn-error-code';
import { toRoutineListItem } from '../mappers/routine-result.mapper';
import { throwRoutinePersistenceException } from '../policies/routine-persistence-error.policy';
import {
  RTN_REPOSITORY,
  RtnRepositoryPort,
} from '../ports/rtn.repository.port';
import { RoutineListItem } from '../types/routine.type';

@Injectable()
export class GetRtnByIdUseCase {
  constructor(
    @Inject(RTN_REPOSITORY)
    private readonly rtnRepository: RtnRepositoryPort,
  ) {}

  async execute(userId: string, rtnId: string): Promise<RoutineListItem> {
    try {
      const routine = await this.rtnRepository.findByIdAndUser(rtnId, userId);
      if (!routine) {
        throw new BusinessException(RtnErrorCode.ROUTINE_NOT_FOUND);
      }

      return toRoutineListItem(routine);
    } catch (error) {
      throwRoutinePersistenceException(error, RtnErrorCode.ROUTINE_GET_FAILED);
    }
  }
}
