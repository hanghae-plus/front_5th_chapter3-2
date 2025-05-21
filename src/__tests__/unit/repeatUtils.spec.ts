import { RepeatInfo } from '../../types';
import {
  getNextRepeatDate,
  isRepeatEnded,
  isExcludedDate,
  isSelectedWeekday,
} from '../../utils/repeatUtils';

describe('반복 일정 ', () => {
  describe('getNextRepeatDate', () => {
    const baseDate = new Date('2024-03-15');

    test('매일 반복의 다음 날짜를 계산한다', () => {
      const repeatInfo: RepeatInfo = {
        type: 'daily',
        interval: 1,
        endType: 'never',
      };

      const nextDate = getNextRepeatDate(baseDate, repeatInfo);
      expect(nextDate?.toISOString().split('T')[0]).toBe('2024-03-16');
    });

    test('매주 반복의 다음 날짜를 계산한다', () => {
      const repeatInfo: RepeatInfo = {
        type: 'weekly',
        interval: 1,
        endType: 'never',
      };

      const nextDate = getNextRepeatDate(baseDate, repeatInfo);
      expect(nextDate?.toISOString().split('T')[0]).toBe('2024-03-22');
    });

    test('매월 반복의 다음 날짜를 계산한다', () => {
      const repeatInfo: RepeatInfo = {
        type: 'monthly',
        interval: 1,
        endType: 'never',
      };

      const nextDate = getNextRepeatDate(baseDate, repeatInfo);
      expect(nextDate?.toISOString().split('T')[0]).toBe('2024-04-15');
    });

    test('매월 특정 주차의 특정 요일로 반복하는 경우', () => {
      const repeatInfo: RepeatInfo = {
        type: 'monthly',
        interval: 1,
        endType: 'never',
        monthlyRepeatType: 'weekday',
        monthlyWeekday: {
          week: 3, // 세 번째 주
          day: 5, // 금요일
        },
      };

      const nextDate = getNextRepeatDate(baseDate, repeatInfo);
      expect(nextDate?.toISOString().split('T')[0]).toBe('2024-04-19'); // 4월 세 번째 금요일
    });
  });

  describe('isRepeatEnded', () => {
    test('종료 날짜가 지난 경우 true를 반환한다', () => {
      const repeatInfo: RepeatInfo = {
        type: 'daily',
        interval: 1,
        endType: 'date',
        endDate: '2024-03-14',
      };

      const currentDate = new Date('2024-03-15');
      expect(isRepeatEnded(currentDate, repeatInfo)).toBe(true);
    });

    test('종료 날짜가 지나지 않은 경우 false를 반환한다', () => {
      const repeatInfo: RepeatInfo = {
        type: 'daily',
        interval: 1,
        endType: 'date',
        endDate: '2024-03-16',
      };

      const currentDate = new Date('2024-03-15');
      expect(isRepeatEnded(currentDate, repeatInfo)).toBe(false);
    });
  });

  describe('isExcludedDate', () => {
    test('제외된 날짜인 경우 true를 반환한다', () => {
      const repeatInfo: RepeatInfo = {
        type: 'daily',
        interval: 1,
        endType: 'never',
        excludedDates: ['2024-03-15'],
      };

      const date = new Date('2024-03-15');
      expect(isExcludedDate(date, repeatInfo)).toBe(true);
    });

    test('제외되지 않은 날짜인 경우 false를 반환한다', () => {
      const repeatInfo: RepeatInfo = {
        type: 'daily',
        interval: 1,
        endType: 'never',
        excludedDates: ['2024-03-15'],
      };

      const date = new Date('2024-03-16');
      expect(isExcludedDate(date, repeatInfo)).toBe(false);
    });
  });

  describe('isSelectedWeekday', () => {
    test('선택된 요일인 경우 true를 반환한다', () => {
      const repeatInfo: RepeatInfo = {
        type: 'weekly',
        interval: 1,
        endType: 'never',
        daysOfWeek: [5], // 금요일
      };

      const date = new Date('2024-03-15'); // 금요일
      expect(isSelectedWeekday(date, repeatInfo)).toBe(true);
    });

    test('선택되지 않은 요일인 경우 false를 반환한다', () => {
      const repeatInfo: RepeatInfo = {
        type: 'weekly',
        interval: 1,
        endType: 'never',
        daysOfWeek: [5], // 금요일
      };

      const date = new Date('2024-03-16'); // 토요일
      expect(isSelectedWeekday(date, repeatInfo)).toBe(false);
    });
  });
});
