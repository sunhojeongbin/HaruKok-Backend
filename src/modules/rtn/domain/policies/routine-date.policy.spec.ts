import {
  getTodayRoutineDate,
  ROUTINE_BUSINESS_TIMEZONE,
} from './routine-date.policy';

describe('Routine Date Policy', () => {
  describe('getTodayRoutineDate', () => {
    it('기본값으로 비즈니스 타임존(Asia/Seoul) 기준 날짜를 반환한다', () => {
      const justBeforeMidnightSeoul = new Date('2026-04-08T14:59:59.000Z');
      const justAfterMidnightSeoul = new Date('2026-04-08T15:00:00.000Z');

      expect(getTodayRoutineDate({ now: justBeforeMidnightSeoul })).toBe(
        '2026-04-08',
      );
      expect(getTodayRoutineDate({ now: justAfterMidnightSeoul })).toBe(
        '2026-04-09',
      );
    });

    it('명시한 timeZone 파라미터 기준으로 날짜를 계산한다', () => {
      const sameInstant = new Date('2026-04-08T15:00:00.000Z');

      expect(getTodayRoutineDate({ now: sameInstant, timeZone: 'UTC' })).toBe(
        '2026-04-08',
      );
      expect(
        getTodayRoutineDate({
          now: sameInstant,
          timeZone: ROUTINE_BUSINESS_TIMEZONE,
        }),
      ).toBe('2026-04-09');
    });
  });
});
