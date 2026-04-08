import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { getTodayRoutineDate } from '../../domain/policies/routine-date.policy';
import { RtnErrorCode } from '../../errors/rtn-error-code';
import { toRoutineListItem } from '../mappers/routine-result.mapper';
import { ensureOwnedRoutineCategory } from '../policies/routine-category.policy';
import { throwRoutinePersistenceException } from '../policies/routine-persistence-error.policy';
import {
  extractRoutineRepeatOptions,
  resolveRoutineTodoDatesByRepeat,
  validateRoutineAlarmTime,
  validateRoutineContent,
  validateRoutineDateRange,
  validateRoutineRepeatOptions,
} from '../policies/routine-validation.policy';
import {
  RTN_REPOSITORY,
  RtnRepositoryPort,
} from '../ports/rtn.repository.port';
import { RoutineListItem, UpdateRoutineInput } from '../types/routine.type';

@Injectable()
export class UpdateRtnUseCase {
  constructor(
    @Inject(RTN_REPOSITORY)
    private readonly rtnRepository: RtnRepositoryPort,
  ) {}

  async execute(
    userId: string,
    rtnId: string,
    input: UpdateRoutineInput,
  ): Promise<RoutineListItem> {
    const hasAnyUpdateField =
      input.ctgId !== undefined ||
      input.rtnContent !== undefined ||
      input.startDt !== undefined ||
      input.endDt !== undefined ||
      input.rptTypeCd !== undefined ||
      input.dayOfWeeks !== undefined ||
      input.dayOfMths !== undefined ||
      input.alarmTime !== undefined;
    if (!hasAnyUpdateField) {
      throw new BusinessException(RtnErrorCode.ROUTINE_UPDATE_PAYLOAD_EMPTY);
    }

    try {
      const routine = await this.rtnRepository.findByIdAndUser(rtnId, userId);
      if (!routine) {
        throw new BusinessException(RtnErrorCode.ROUTINE_NOT_FOUND);
      }

      const ctgId = input.ctgId ?? routine.ctgId;
      if (input.ctgId !== undefined) {
        await ensureOwnedRoutineCategory(
          this.rtnRepository,
          userId,
          input.ctgId,
        );
      }

      const rtnContent =
        input.rtnContent !== undefined
          ? validateRoutineContent(input.rtnContent)
          : routine.rtnContent;
      const startDt = input.startDt ?? routine.startDt;
      const endDt = input.endDt ?? routine.endDt;
      validateRoutineDateRange(startDt, endDt);

      const rptTypeCd = input.rptTypeCd ?? routine.rptTypeCd;
      const currentRepeatOptions = extractRoutineRepeatOptions(routine);
      const repeatOptions = validateRoutineRepeatOptions(
        rptTypeCd,
        input.dayOfWeeks ?? currentRepeatOptions.dayOfWeeks,
        input.dayOfMths ?? currentRepeatOptions.dayOfMths,
      );

      const alarmTime =
        input.alarmTime !== undefined
          ? validateRoutineAlarmTime(input.alarmTime)
          : routine.alarmTime;

      const todayDate = getTodayRoutineDate();
      const targetStartDate = startDt > todayDate ? startDt : todayDate;
      const todoDatesFromToday =
        targetStartDate <= endDt
          ? resolveRoutineTodoDatesByRepeat(
              targetStartDate,
              endDt,
              rptTypeCd,
              repeatOptions,
            )
          : [];

      const updatedRoutine = await this.rtnRepository.updateFromToday({
        usrId: userId,
        rtnId,
        ctgId,
        rtnContent,
        rptTypeCd,
        startDt,
        endDt,
        alarmTime,
        dayOfWeeks: repeatOptions.dayOfWeeks,
        dayOfMths: repeatOptions.dayOfMths,
        todayDate,
        todoDatesFromToday,
      });

      if (!updatedRoutine) {
        throw new BusinessException(RtnErrorCode.ROUTINE_NOT_FOUND);
      }

      return toRoutineListItem(updatedRoutine);
    } catch (error) {
      throwRoutinePersistenceException(
        error,
        RtnErrorCode.ROUTINE_UPDATE_FAILED,
      );
    }
  }
}
