import { Inject, Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { BusinessException } from '../../common/exceptions/business.exception';
import { RtnResponse } from '../../common/response/rtn.response';
import { CreateRtnDto } from './dtos/create-rtn.dto';
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
  rtnDesc: string | null;
  rptTypeCd: RptType;
  startDt: string;
  endDt: string;
  alarmTime: string | null;
  createdAt: Date;
  updatedAt: Date;
  repeats: RoutineRepeatItem[];
};

/** @description 루틴 생성 응답 데이터 형식 */
type RoutineCreateResult = RoutineListItem & {
  createdTodoCount: number;
};

/** @description 루틴 비즈니스 로직을 처리하는 서비스 */
@Injectable()
export class RtnService {
  private readonly DATE_PATTERN =
    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  private readonly TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

  constructor(
    @Inject(RTN_REPOSITORY)
    private readonly rtnRepository: RtnRepositoryPort,
  ) {}

  /** @description 루틴 엔티티를 API 응답 객체로 변환 */
  private toRoutineListItem(rtn: RtnEntity): RoutineListItem {
    return {
      rtnId: rtn.rtnId,
      usrId: rtn.usrId,
      ctgId: rtn.ctgId,
      rtnContent: rtn.rtnContent,
      rtnDesc: rtn.rtnDesc,
      rptTypeCd: rtn.rptTypeCd,
      startDt: rtn.startDt,
      endDt: rtn.endDt,
      alarmTime: rtn.alarmTime,
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

  /** @description HH:mm 또는 HH:mm:ss 형식의 시간을 HH:mm:ss로 정규화 */
  private normalizeAlarmTime(alarmTime?: string): string | null {
    if (alarmTime === undefined) {
      return null;
    }

    const normalizedAlarmTime = alarmTime.trim();
    if (!normalizedAlarmTime) {
      return null;
    }

    if (!this.TIME_PATTERN.test(normalizedAlarmTime)) {
      throw new BusinessException(RtnResponse.ROUTINE_ALARM_TIME_INVALID);
    }

    return normalizedAlarmTime.length === 5
      ? `${normalizedAlarmTime}:00`
      : normalizedAlarmTime;
  }

  /** @description YYYY-MM-DD 날짜에 일 수를 더해 YYYY-MM-DD로 반환 */
  private addDays(dateText: string, days: number): string {
    const [year, month, day] = dateText.split('-').map(Number);
    const baseDate = new Date(Date.UTC(year, month - 1, day));
    baseDate.setUTCDate(baseDate.getUTCDate() + days);
    return `${baseDate.getUTCFullYear()}-${String(baseDate.getUTCMonth() + 1).padStart(2, '0')}-${String(baseDate.getUTCDate()).padStart(2, '0')}`;
  }

  /** @description YYYY-MM-DD 기준 요일(0:일~6:토) 반환 */
  private getDayOfWeek(dateText: string): number {
    const [year, month, day] = dateText.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
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
      throw new BusinessException(RtnResponse.ROUTINE_NAME_INVALID);
    }
    return normalizedContent;
  }

  /** @description 반복 조건을 타입별로 검증하여 정규화 */
  private resolveRepeatOptions(
    rptTypeCd: RptType,
    dayOfWeeks?: number[],
    dayOfMths?: number[],
  ): { normalizedDayOfWeeks: number[]; normalizedDayOfMths: number[] } {
    const normalizedDayOfWeeks = [...new Set(dayOfWeeks ?? [])];
    const normalizedDayOfMths = [...new Set(dayOfMths ?? [])];

    if (rptTypeCd === RptType.WEEKLY && normalizedDayOfWeeks.length === 0) {
      throw new BusinessException(RtnResponse.ROUTINE_REPEAT_DAYS_REQUIRED);
    }

    if (rptTypeCd === RptType.MONTHLY && normalizedDayOfMths.length === 0) {
      throw new BusinessException(RtnResponse.ROUTINE_REPEAT_DATES_REQUIRED);
    }

    return { normalizedDayOfWeeks, normalizedDayOfMths };
  }

  /** @description 반복 유형에 맞는 투두 생성 날짜를 계산 */
  private resolveTodoDates(
    startDt: string,
    endDt: string,
    rptTypeCd: RptType,
    dayOfWeeks: number[],
    dayOfMths: number[],
  ): string[] {
    const allDates = this.buildDateRange(startDt, endDt);

    if (rptTypeCd === RptType.DAILY) {
      return allDates;
    }

    if (rptTypeCd === RptType.WEEKLY) {
      const weeklySet = new Set(dayOfWeeks);
      return allDates.filter((dateText) =>
        weeklySet.has(this.getDayOfWeek(dateText)),
      );
    }

    const monthlySet = new Set(dayOfMths);
    return allDates.filter((dateText) =>
      monthlySet.has(Number(dateText.split('-')[2])),
    );
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
      throw new BusinessException(RtnResponse.ROUTINE_DATE_INVALID);
    }

    if (dto.endDt < dto.startDt) {
      throw new BusinessException(RtnResponse.ROUTINE_DATE_RANGE_INVALID);
    }

    const alarmTime = this.normalizeAlarmTime(dto.alarmTime);
    const { normalizedDayOfWeeks, normalizedDayOfMths } =
      this.resolveRepeatOptions(dto.rptTypeCd, dto.dayOfWeeks, dto.dayOfMths);

    const todoDates = this.resolveTodoDates(
      dto.startDt,
      dto.endDt,
      dto.rptTypeCd,
      normalizedDayOfWeeks,
      normalizedDayOfMths,
    );
    if (todoDates.length === 0) {
      throw new BusinessException(RtnResponse.ROUTINE_TODO_DATES_EMPTY);
    }

    const isOwnedCategory = await this.rtnRepository.isCategoryOwnedByUser(
      userId,
      dto.ctgId,
    );
    if (!isOwnedCategory) {
      throw new BusinessException(RtnResponse.ROUTINE_CATEGORY_NOT_FOUND);
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
        dayOfWeeks: normalizedDayOfWeeks,
        dayOfMths: normalizedDayOfMths,
        todoDates,
      });

      return {
        ...this.toRoutineListItem(created.rtn),
        createdTodoCount: created.createdTodoCount,
      };
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      if (error instanceof QueryFailedError) {
        throw new BusinessException(RtnResponse.ROUTINE_CREATE_FAILED);
      }
      throw new BusinessException(RtnResponse.ROUTINE_CREATE_FAILED);
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
        throw new BusinessException(RtnResponse.ROUTINE_LIST_FAILED);
      }
      throw new BusinessException(RtnResponse.ROUTINE_LIST_FAILED);
    }
  }
}
