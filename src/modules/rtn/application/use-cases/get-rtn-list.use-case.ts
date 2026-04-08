import { Inject, Injectable } from '@nestjs/common';
import { toRoutineListItem } from '../mappers/routine-result.mapper';
import { throwRoutinePersistenceException } from '../policies/routine-persistence-error.policy';
import {
  RTN_REPOSITORY,
  RtnRepositoryPort,
} from '../ports/rtn.repository.port';
import { RoutineListItem } from '../types/routine.type';
import { RtnErrorCode } from '../../errors/rtn-error-code';

@Injectable()
export class GetRtnListUseCase {
  constructor(
    @Inject(RTN_REPOSITORY)
    private readonly rtnRepository: RtnRepositoryPort,
  ) {}

  async execute(userId: string): Promise<RoutineListItem[]> {
    try {
      const routines = await this.rtnRepository.findAllByUser(userId);
      return routines.map((routine) => toRoutineListItem(routine));
    } catch (error) {
      throwRoutinePersistenceException(error, RtnErrorCode.ROUTINE_LIST_FAILED);
    }
  }
}
