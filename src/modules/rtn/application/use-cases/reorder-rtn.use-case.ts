import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { RtnEntity } from '../../entities/rtn.entity';
import { RtnErrorCode } from '../../errors/rtn-error-code';
import { ensureOwnedRoutineCategory } from '../policies/routine-category.policy';
import { throwRoutinePersistenceException } from '../policies/routine-persistence-error.policy';
import {
  RTN_REPOSITORY,
  RtnRepositoryPort,
} from '../ports/rtn.repository.port';
import { ReorderRoutineInput, RoutineOrderItem } from '../types/routine.type';

@Injectable()
export class ReorderRtnUseCase {
  constructor(
    @Inject(RTN_REPOSITORY)
    private readonly rtnRepository: RtnRepositoryPort,
  ) {}

  async execute(
    userId: string,
    input: ReorderRoutineInput,
  ): Promise<RoutineOrderItem[]> {
    await ensureOwnedRoutineCategory(this.rtnRepository, userId, input.ctgId);

    const routinesInCategory =
      await this.rtnRepository.findAllByUserAndCategory(userId, input.ctgId);

    if (input.rtnIds.length !== routinesInCategory.length) {
      throw new BusinessException(RtnErrorCode.ROUTINE_ORDER_INVALID);
    }
    if (new Set(input.rtnIds).size !== input.rtnIds.length) {
      throw new BusinessException(RtnErrorCode.ROUTINE_ORDER_INVALID);
    }

    const routineById = new Map(
      routinesInCategory.map((routine) => [routine.rtnId, routine]),
    );
    const reorderedRoutines: RtnEntity[] = [];
    for (const rtnId of input.rtnIds) {
      const routine = routineById.get(rtnId);
      if (!routine) {
        throw new BusinessException(RtnErrorCode.ROUTINE_ORDER_INVALID);
      }
      reorderedRoutines.push(routine);
    }

    for (let i = 0; i < reorderedRoutines.length; i += 1) {
      reorderedRoutines[i].sortOrder = i;
    }

    try {
      const saved = await this.rtnRepository.saveMany(reorderedRoutines);
      return saved
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((routine) => ({
          rtnId: routine.rtnId,
          sortOrder: routine.sortOrder,
        }));
    } catch (error) {
      throwRoutinePersistenceException(
        error,
        RtnErrorCode.ROUTINE_ORDER_UPDATE_FAILED,
      );
    }
  }
}
