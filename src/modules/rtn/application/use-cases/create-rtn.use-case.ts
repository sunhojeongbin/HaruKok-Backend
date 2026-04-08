import { Inject, Injectable } from '@nestjs/common';
import { ensureOwnedRoutineCategory } from '../policies/routine-category.policy';
import { throwRoutinePersistenceException } from '../policies/routine-persistence-error.policy';
import {
  resolveRoutineTodoDatesForCreate,
  validateRoutineAlarmTime,
  validateRoutineContent,
  validateRoutineDateRange,
  validateRoutineRepeatOptions,
} from '../policies/routine-validation.policy';
import {
  RTN_REPOSITORY,
  RtnRepositoryPort,
} from '../ports/rtn.repository.port';
import { CreateRoutineInput, RoutineCreateResult } from '../types/routine.type';
import { RtnErrorCode } from '../../errors/rtn-error-code';
import { toRoutineCreateItem } from '../mappers/routine-result.mapper';

@Injectable()
export class CreateRtnUseCase {
  constructor(
    @Inject(RTN_REPOSITORY)
    private readonly rtnRepository: RtnRepositoryPort,
  ) {}

  async execute(
    userId: string,
    input: CreateRoutineInput,
  ): Promise<RoutineCreateResult> {
    const rtnContent = validateRoutineContent(input.rtnContent);
    validateRoutineDateRange(input.startDt, input.endDt);
    const alarmTime = validateRoutineAlarmTime(input.alarmTime);
    const repeatOptions = validateRoutineRepeatOptions(
      input.rptTypeCd,
      input.dayOfWeeks,
      input.dayOfMths,
    );
    const todoDates = resolveRoutineTodoDatesForCreate(
      input.startDt,
      input.endDt,
      input.rptTypeCd,
      repeatOptions,
    );

    await ensureOwnedRoutineCategory(this.rtnRepository, userId, input.ctgId);

    try {
      const created = await this.rtnRepository.createWithTodos({
        usrId: userId,
        ctgId: input.ctgId,
        rtnContent,
        rptTypeCd: input.rptTypeCd,
        startDt: input.startDt,
        endDt: input.endDt,
        alarmTime,
        dayOfWeeks: repeatOptions.dayOfWeeks,
        dayOfMths: repeatOptions.dayOfMths,
        todoDates,
      });

      return {
        ...toRoutineCreateItem(created.rtn),
        createdTodoCount: created.createdTodoCount,
      };
    } catch (error) {
      throwRoutinePersistenceException(
        error,
        RtnErrorCode.ROUTINE_CREATE_FAILED,
      );
    }
  }
}
