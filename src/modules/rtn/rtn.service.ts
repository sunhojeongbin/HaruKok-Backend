import { Inject, Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { BusinessException } from '../../common/exceptions/business.exception';
import { RtnErrorCode } from './errors/rtn-error-code';
import {
  normalizeRepeatOptions,
  resolveTodoDatesByRepeat,
  validateRepeatOptions,
} from './domain/routine-repeat.policy';
import { CreateRtnDto } from './dtos/create-rtn.dto';
import { ReorderRtnDto } from './dtos/reorder-rtn.dto';
import { UpdateRtnDto } from './dtos/update-rtn.dto';
import { RptType } from './enums/rpt-type.enum';
import { RtnEntity } from './entities/rtn.entity';
import {
  RTN_REPOSITORY,
  RtnRepositoryPort,
} from './repositories/rtn.repository.port';

/** @description 루틴 반복 설정 응답 데이터 형식 */
type RoutineRepeatItem = {
  rtnRptId: string;
  rptTypeCd: RptType;
  dayOfWeek: number | null;
  dayOfMth: number | null;
};

/** @description 루틴 목록 응답 데이터 형식 */
type RoutineListItem = {
  rtnId: string;
  usrId: string;
  ctgId: string;
  rtnContent: string;
  rptTypeCd: RptType;
  startDt: string;
  endDt: string;
  alarmTime: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  repeats: RoutineRepeatItem[];
};

/** @description 루틴 생성 응답 데이터 형식 */
type RoutineCreateItem = RoutineListItem & {
  ctgColorCode: string | null;
};

/** @description 루틴 생성 응답 데이터 형식 */
type RoutineCreateResult = RoutineCreateItem & {
  createdTodoCount: number;
};

/** @description 루틴 삭제 응답 데이터 형식 */
type RoutineDeleteResult = {
  rtnId: string;
};

/** @description 루틴 순서 변경 응답 데이터 형식 */
type RoutineOrderItem = {
  rtnId: string;
  sortOrder: number;
};

/** @description 루틴 비즈니스 로직을 처리하는 서비스 */
@Injectable()
export class RtnService {
  private readonly DATE_PATTERN =
    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  private readonly TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

  constructor(
    @Inject(RTN_REPOSITORY)
    private readonly rtnRepository: RtnRepositoryPort,
  ) {}

  /** @description 알림 시간을 HH:mm 형식으로 반환 */
  private formatAlarmTime(alarmTime: string | null): string | null {
    if (!alarmTime) {
      return null;
    }

    const trimmedAlarmTime = alarmTime.trim();
    if (!trimmedAlarmTime) {
      return null;
    }

    return trimmedAlarmTime.length >= 5
      ? trimmedAlarmTime.slice(0, 5)
      : trimmedAlarmTime;
  }

  /** @description 루틴 엔티티를 루틴 목록 API 응답 객체로 변환 */
  private toRoutineListItem(rtn: RtnEntity): RoutineListItem {
    return {
      rtnId: rtn.rtnId,
      usrId: rtn.usrId,
      ctgId: rtn.ctgId,
      rtnContent: rtn.rtnContent,
      rptTypeCd: rtn.rptTypeCd,
      startDt: rtn.startDt,
      endDt: rtn.endDt,
      alarmTime: this.formatAlarmTime(rtn.alarmTime),
      sortOrder: rtn.sortOrder,
      createdAt: rtn.createdAt,
      updatedAt: rtn.updatedAt,
      repeats: (rtn.rtnRpts ?? []).map((repeat) => ({
        rtnRptId: repeat.rtnRptId,
        rptTypeCd: repeat.rptTypeCd,
        dayOfWeek: repeat.dayOfWeek,
        dayOfMth: repeat.dayOfMth,
      })),
    };
  }

  /** @description 루틴 엔티티를 루틴 생성 API 응답 객체로 변환 */
  private toRoutineCreateItem(rtn: RtnEntity): RoutineCreateItem {
    return {
      ...this.toRoutineListItem(rtn),
      ctgColorCode: rtn.ctg?.colorCode ?? null,
    };
  }

  /** @description 날짜 문자열(YYYY-MM-DD)이 실제 달력 날짜인지 확인 */
  private isValidDateText(dateText: string): boolean {
    if (!this.DATE_PATTERN.test(dateText)) {
      return false;
    }

    const [year, month, day] = dateText.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    return (
      parsedDate.getUTCFullYear() === year &&
      parsedDate.getUTCMonth() === month - 1 &&
      parsedDate.getUTCDate() === day
    );
  }

  /** @description 오늘 날짜를 YYYY-MM-DD 형식으로 반환 */
  private getTodayDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** @description HH:mm 형식의 시간을 검증/정규화 */
  private normalizeAlarmTime(alarmTime?: string): string | null {
    if (alarmTime === undefined) {
      return null;
    }

    const normalizedAlarmTime = alarmTime.trim();
    if (!normalizedAlarmTime) {
      return null;
    }

    if (!this.TIME_PATTERN.test(normalizedAlarmTime)) {
      throw new BusinessException(RtnErrorCode.ROUTINE_ALARM_TIME_INVALID);
    }

    return normalizedAlarmTime;
  }

  /** @description YYYY-MM-DD 날짜에 일 수를 더해 YYYY-MM-DD로 반환 */
  private addDays(dateText: string, days: number): string {
    const [year, month, day] = dateText.split('-').map(Number);
    const baseDate = new Date(Date.UTC(year, month - 1, day));
    baseDate.setUTCDate(baseDate.getUTCDate() + days);
    return `${baseDate.getUTCFullYear()}-${String(baseDate.getUTCMonth() + 1).padStart(2, '0')}-${String(baseDate.getUTCDate()).padStart(2, '0')}`;
  }

  /** @description 시작~종료(포함) 날짜 배열을 생성 */
  private buildDateRange(startDt: string, endDt: string): string[] {
    const dates: string[] = [];
    let cursor = startDt;
    while (cursor <= endDt) {
      dates.push(cursor);
      cursor = this.addDays(cursor, 1);
    }
    return dates;
  }

  /** @description 루틴 내용 정규화 및 검증 */
  private normalizeRoutineContent(rtnContent: string): string {
    const normalizedContent = rtnContent.trim();
    if (!normalizedContent || normalizedContent.length > 100) {
      throw new BusinessException(RtnErrorCode.ROUTINE_NAME_INVALID);
    }
    return normalizedContent;
  }

  /** @description 루틴 엔티티의 현재 반복 옵션을 추출 */
  private resolveCurrentRepeatOptions(rtn: RtnEntity): {
    dayOfWeeks: number[];
    dayOfMths: number[];
  } {
    const dayOfWeeks = [
      ...new Set(
        (rtn.rtnRpts ?? [])
          .map((repeat) => repeat.dayOfWeek)
          .filter((day): day is number => day !== null),
      ),
    ];
    const dayOfMths = [
      ...new Set(
        (rtn.rtnRpts ?? [])
          .map((repeat) => repeat.dayOfMth)
          .filter((day): day is number => day !== null),
      ),
    ];

    return { dayOfWeeks, dayOfMths };
  }

  /**
   * @description 로그인 사용자의 루틴 생성
   * @param userId 사용자 ID
   * @param dto 루틴 생성 요청 데이터
   */
  async create(
    userId: string,
    dto: CreateRtnDto,
  ): Promise<RoutineCreateResult> {
    const rtnContent = this.normalizeRoutineContent(dto.rtnContent);

    if (
      !this.isValidDateText(dto.startDt) ||
      !this.isValidDateText(dto.endDt)
    ) {
      throw new BusinessException(RtnErrorCode.ROUTINE_DATE_INVALID);
    }

    if (dto.endDt < dto.startDt) {
      throw new BusinessException(RtnErrorCode.ROUTINE_DATE_RANGE_INVALID);
    }

    const alarmTime = this.normalizeAlarmTime(dto.alarmTime);
    const repeatOptions = normalizeRepeatOptions(dto.dayOfWeeks, dto.dayOfMths);
    const repeatOptionsError = validateRepeatOptions(
      dto.rptTypeCd,
      repeatOptions,
    );
    if (repeatOptionsError) {
      throw new BusinessException(repeatOptionsError);
    }

    const todoDates = resolveTodoDatesByRepeat(
      this.buildDateRange(dto.startDt, dto.endDt),
      dto.rptTypeCd,
      repeatOptions,
    );
    if (todoDates.length === 0) {
      throw new BusinessException(RtnErrorCode.ROUTINE_TODO_DATES_EMPTY);
    }

    const isOwnedCategory = await this.rtnRepository.isCategoryOwnedByUser(
      userId,
      dto.ctgId,
    );
    if (!isOwnedCategory) {
      throw new BusinessException(RtnErrorCode.ROUTINE_CATEGORY_NOT_FOUND);
    }

    try {
      const created = await this.rtnRepository.createWithTodos({
        usrId: userId,
        ctgId: dto.ctgId,
        rtnContent,
        rptTypeCd: dto.rptTypeCd,
        startDt: dto.startDt,
        endDt: dto.endDt,
        alarmTime,
        dayOfWeeks: repeatOptions.dayOfWeeks,
        dayOfMths: repeatOptions.dayOfMths,
        todoDates,
      });

      return {
        ...this.toRoutineCreateItem(created.rtn),
        createdTodoCount: created.createdTodoCount,
      };
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      if (error instanceof QueryFailedError) {
        throw new BusinessException(RtnErrorCode.ROUTINE_CREATE_FAILED);
      }
      throw new BusinessException(RtnErrorCode.ROUTINE_CREATE_FAILED);
    }
  }

  /**
   * @description 로그인 사용자의 루틴 수정(오늘 이후 투두 동기화)
   * @param userId 사용자 ID
   * @param rtnId 수정할 루틴 ID
   * @param dto 루틴 수정 요청 데이터
   */
  async update(
    userId: string,
    rtnId: string,
    dto: UpdateRtnDto,
  ): Promise<RoutineListItem> {
    const hasAnyUpdateField =
      dto.ctgId !== undefined ||
      dto.rtnContent !== undefined ||
      dto.startDt !== undefined ||
      dto.endDt !== undefined ||
      dto.rptTypeCd !== undefined ||
      dto.dayOfWeeks !== undefined ||
      dto.dayOfMths !== undefined ||
      dto.alarmTime !== undefined;
    if (!hasAnyUpdateField) {
      throw new BusinessException(RtnErrorCode.ROUTINE_UPDATE_PAYLOAD_EMPTY);
    }

    const routine = await this.rtnRepository.findByIdAndUser(rtnId, userId);
    if (!routine) {
      throw new BusinessException(RtnErrorCode.ROUTINE_NOT_FOUND);
    }

    const ctgId = dto.ctgId ?? routine.ctgId;
    if (dto.ctgId !== undefined) {
      const isOwnedCategory = await this.rtnRepository.isCategoryOwnedByUser(
        userId,
        dto.ctgId,
      );
      if (!isOwnedCategory) {
        throw new BusinessException(RtnErrorCode.ROUTINE_CATEGORY_NOT_FOUND);
      }
    }

    const rtnContent =
      dto.rtnContent !== undefined
        ? this.normalizeRoutineContent(dto.rtnContent)
        : routine.rtnContent;
    const startDt = dto.startDt ?? routine.startDt;
    const endDt = dto.endDt ?? routine.endDt;

    if (!this.isValidDateText(startDt) || !this.isValidDateText(endDt)) {
      throw new BusinessException(RtnErrorCode.ROUTINE_DATE_INVALID);
    }
    if (endDt < startDt) {
      throw new BusinessException(RtnErrorCode.ROUTINE_DATE_RANGE_INVALID);
    }

    const rptTypeCd = dto.rptTypeCd ?? routine.rptTypeCd;
    const currentRepeatOptions = this.resolveCurrentRepeatOptions(routine);
    const repeatOptions = normalizeRepeatOptions(
      dto.dayOfWeeks ?? currentRepeatOptions.dayOfWeeks,
      dto.dayOfMths ?? currentRepeatOptions.dayOfMths,
    );
    const repeatOptionsError = validateRepeatOptions(rptTypeCd, repeatOptions);
    if (repeatOptionsError) {
      throw new BusinessException(repeatOptionsError);
    }

    const alarmTime =
      dto.alarmTime !== undefined
        ? this.normalizeAlarmTime(dto.alarmTime)
        : routine.alarmTime;

    const todayDate = this.getTodayDate();
    const targetStartDate = startDt > todayDate ? startDt : todayDate;
    const todoDatesFromToday =
      targetStartDate <= endDt
        ? resolveTodoDatesByRepeat(
            this.buildDateRange(targetStartDate, endDt),
            rptTypeCd,
            repeatOptions,
          )
        : [];

    try {
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

      return this.toRoutineListItem(updatedRoutine);
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      if (error instanceof QueryFailedError) {
        throw new BusinessException(RtnErrorCode.ROUTINE_UPDATE_FAILED);
      }
      throw new BusinessException(RtnErrorCode.ROUTINE_UPDATE_FAILED);
    }
  }

  /**
   * @description 로그인 사용자의 루틴 삭제(오늘 이후 투두 삭제)
   * @param userId 사용자 ID
   * @param rtnId 삭제할 루틴 ID
   */
  async delete(userId: string, rtnId: string): Promise<RoutineDeleteResult> {
    const routine = await this.rtnRepository.findByIdAndUser(rtnId, userId);
    if (!routine) {
      throw new BusinessException(RtnErrorCode.ROUTINE_NOT_FOUND);
    }

    try {
      const isDeleted = await this.rtnRepository.deleteFromToday(
        rtnId,
        userId,
        this.getTodayDate(),
      );
      if (!isDeleted) {
        throw new BusinessException(RtnErrorCode.ROUTINE_NOT_FOUND);
      }

      return { rtnId };
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      if (error instanceof QueryFailedError) {
        throw new BusinessException(RtnErrorCode.ROUTINE_DELETE_FAILED);
      }
      throw new BusinessException(RtnErrorCode.ROUTINE_DELETE_FAILED);
    }
  }

  /**
   * @description 로그인 사용자의 동일 카테고리 내 루틴 순서를 변경
   * @param userId 사용자 ID
   * @param dto 루틴 순서 변경 요청 데이터
   */
  async reorder(
    userId: string,
    dto: ReorderRtnDto,
  ): Promise<RoutineOrderItem[]> {
    const isOwnedCategory = await this.rtnRepository.isCategoryOwnedByUser(
      userId,
      dto.ctgId,
    );
    if (!isOwnedCategory) {
      throw new BusinessException(RtnErrorCode.ROUTINE_CATEGORY_NOT_FOUND);
    }

    const routinesInCategory =
      await this.rtnRepository.findAllByUserAndCategory(userId, dto.ctgId);

    if (dto.rtnIds.length !== routinesInCategory.length) {
      throw new BusinessException(RtnErrorCode.ROUTINE_ORDER_INVALID);
    }
    if (new Set(dto.rtnIds).size !== dto.rtnIds.length) {
      throw new BusinessException(RtnErrorCode.ROUTINE_ORDER_INVALID);
    }

    const routineById = new Map(
      routinesInCategory.map((routine) => [routine.rtnId, routine]),
    );
    const reorderedRoutines: RtnEntity[] = [];
    for (const rtnId of dto.rtnIds) {
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
      if (error instanceof BusinessException) {
        throw error;
      }
      if (error instanceof QueryFailedError) {
        throw new BusinessException(RtnErrorCode.ROUTINE_ORDER_UPDATE_FAILED);
      }
      throw new BusinessException(RtnErrorCode.ROUTINE_ORDER_UPDATE_FAILED);
    }
  }

  /**
   * @description 로그인 사용자의 활성 루틴 상세 조회
   * @param userId 사용자 ID
   * @param rtnId 조회할 루틴 ID
   */
  async getById(userId: string, rtnId: string): Promise<RoutineListItem> {
    try {
      const routine = await this.rtnRepository.findByIdAndUser(rtnId, userId);
      if (!routine) {
        throw new BusinessException(RtnErrorCode.ROUTINE_NOT_FOUND);
      }
      return this.toRoutineListItem(routine);
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      if (error instanceof QueryFailedError) {
        throw new BusinessException(RtnErrorCode.ROUTINE_GET_FAILED);
      }
      throw new BusinessException(RtnErrorCode.ROUTINE_GET_FAILED);
    }
  }

  /**
   * @description 로그인 사용자의 활성 루틴 목록 조회
   * @param userId 사용자 ID
   */
  async getList(userId: string): Promise<RoutineListItem[]> {
    try {
      const routines = await this.rtnRepository.findAllByUser(userId);
      return routines.map((routine) => this.toRoutineListItem(routine));
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      if (error instanceof QueryFailedError) {
        throw new BusinessException(RtnErrorCode.ROUTINE_LIST_FAILED);
      }
      throw new BusinessException(RtnErrorCode.ROUTINE_LIST_FAILED);
    }
  }
}
