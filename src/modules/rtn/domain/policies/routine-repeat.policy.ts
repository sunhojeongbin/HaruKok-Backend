import { RptType } from '../../enums/rpt-type.enum';

export type RepeatOptions = {
  dayOfWeeks: number[];
  dayOfMths: number[];
};

export type RepeatSeed = {
  rptTypeCd: RptType;
  dayOfWeek: number | null;
  dayOfMth: number | null;
};

export type RepeatOptionsValidationError =
  | 'ROUTINE_REPEAT_DAYS_REQUIRED'
  | 'ROUTINE_REPEAT_DATES_REQUIRED';

type RepeatStrategy = {
  validate(options: RepeatOptions): RepeatOptionsValidationError | null;
  matches(dateText: string, options: RepeatOptions): boolean;
  buildSeeds(options: RepeatOptions): RepeatSeed[];
};

const getDayOfWeek = (dateText: string): number => {
  const [year, month, day] = dateText.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};

const repeatStrategies: Record<RptType, RepeatStrategy> = {
  [RptType.DAILY]: {
    validate: () => null,
    matches: () => true,
    buildSeeds: () => [
      {
        rptTypeCd: RptType.DAILY,
        dayOfWeek: null,
        dayOfMth: null,
      },
    ],
  },
  [RptType.WEEKLY]: {
    validate: (options) =>
      options.dayOfWeeks.length === 0 ? 'ROUTINE_REPEAT_DAYS_REQUIRED' : null,
    matches: (dateText, options) =>
      new Set(options.dayOfWeeks).has(getDayOfWeek(dateText)),
    buildSeeds: (options) =>
      options.dayOfWeeks.map((dayOfWeek) => ({
        rptTypeCd: RptType.WEEKLY,
        dayOfWeek,
        dayOfMth: null,
      })),
  },
  [RptType.MONTHLY]: {
    validate: (options) =>
      options.dayOfMths.length === 0 ? 'ROUTINE_REPEAT_DATES_REQUIRED' : null,
    matches: (dateText, options) =>
      new Set(options.dayOfMths).has(Number(dateText.split('-')[2])),
    buildSeeds: (options) =>
      options.dayOfMths.map((dayOfMth) => ({
        rptTypeCd: RptType.MONTHLY,
        dayOfWeek: null,
        dayOfMth,
      })),
  },
};

export function normalizeRepeatOptions(
  dayOfWeeks?: number[],
  dayOfMths?: number[],
): RepeatOptions {
  return {
    dayOfWeeks: [...new Set(dayOfWeeks ?? [])],
    dayOfMths: [...new Set(dayOfMths ?? [])],
  };
}

export function validateRepeatOptions(
  rptTypeCd: RptType,
  options: RepeatOptions,
): RepeatOptionsValidationError | null {
  return repeatStrategies[rptTypeCd].validate(options);
}

export function resolveTodoDatesByRepeat(
  allDates: string[],
  rptTypeCd: RptType,
  options: RepeatOptions,
): string[] {
  const strategy = repeatStrategies[rptTypeCd];
  return allDates.filter((dateText) => strategy.matches(dateText, options));
}

export function buildRepeatSeeds(
  rptTypeCd: RptType,
  options: RepeatOptions,
): RepeatSeed[] {
  return repeatStrategies[rptTypeCd].buildSeeds(options);
}
