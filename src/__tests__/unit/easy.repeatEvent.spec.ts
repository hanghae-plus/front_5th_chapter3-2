import { addDays, addMonths, addWeeks, addYears, format } from 'date-fns';
import { describe, it, expect } from 'vitest';

describe('반복 일정 기본 기능', () => {
  describe('반복 유형 선택', () => {
    it('매일 반복 일정을 생성할 수 있다', () => {
      const startDate = new Date('2024-03-20');
      const interval = 1;
      const endDate = new Date('2024-03-25');

      const expectedDates = [
        '2024-03-20',
        '2024-03-21',
        '2024-03-22',
        '2024-03-23',
        '2024-03-24',
        '2024-03-25',
      ];

      const dates = [];
      let currentDate = startDate;
      while (currentDate <= endDate) {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addDays(currentDate, interval);
      }

      expect(dates).toEqual(expectedDates);
    });

    it('매주 반복 일정을 생성할 수 있다', () => {
      const startDate = new Date('2024-03-20');
      const interval = 2; // 2주마다
      const endDate = new Date('2024-04-18');

      const expectedDates = ['2024-03-20', '2024-04-03', '2024-04-17'];

      const dates = [];
      let currentDate = startDate;
      while (currentDate <= endDate) {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addWeeks(currentDate, interval);
      }

      expect(dates).toEqual(expectedDates);
    });

    it('매월 반복 일정을 생성할 수 있다', () => {
      const startDate = new Date('2024-01-31');
      const interval = 1;
      const endDate = new Date('2024-04-30');

      // 31일이 없는 달의 경우 마지막 날짜로 조정
      const expectedDates = [
        '2024-01-31',
        '2024-02-29', // 2024년은 윤년
        '2024-03-31',
        '2024-04-30',
      ];

      const dates = [];
      let currentDate = startDate;
      while (currentDate <= endDate) {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addMonths(currentDate, interval);
      }

      expect(dates).toEqual(expectedDates);
    });

    it('매년 반복 일정을 생성할 수 있다', () => {
      const startDate = new Date('2024-02-29');
      const interval = 1;
      const endDate = new Date('2028-02-29');

      // 윤년이 아닌 경우 2월 28일로 조정
      const expectedDates = ['2024-02-29', '2025-02-28', '2026-02-28', '2027-02-28', '2028-02-29'];

      const dates = [];
      let currentDate = startDate;
      while (currentDate <= endDate) {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addYears(currentDate, interval);
      }

      expect(dates).toEqual(expectedDates);
    });
  });

  describe('반복 간격 설정', () => {
    it('2일마다 반복되는 일정을 생성할 수 있다', () => {
      const startDate = new Date('2024-03-20');
      const interval = 2;
      const endDate = new Date('2024-03-26');

      const expectedDates = ['2024-03-20', '2024-03-22', '2024-03-24', '2024-03-26'];

      const dates = [];
      let currentDate = startDate;
      while (currentDate <= endDate) {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addDays(currentDate, interval);
      }

      expect(dates).toEqual(expectedDates);
    });

    it('3주마다 반복되는 일정을 생성할 수 있다', () => {
      const startDate = new Date('2024-03-20');
      const interval = 3;
      const endDate = new Date('2024-04-10');

      const expectedDates = ['2024-03-20', '2024-04-10'];

      const dates = [];
      let currentDate = startDate;
      while (currentDate <= endDate) {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addWeeks(currentDate, interval);
      }

      expect(dates).toEqual(expectedDates);
    });
  });

  describe('반복 종료 조건', () => {
    it('특정 날짜까지 반복되는 일정을 생성할 수 있다', () => {
      const startDate = new Date('2024-03-20');
      const interval = 1;
      const endDate = new Date('2024-03-22');

      const expectedDates = ['2024-03-20', '2024-03-21', '2024-03-22'];

      const dates = [];
      let currentDate = startDate;
      while (currentDate <= endDate) {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addDays(currentDate, interval);
      }

      expect(dates).toEqual(expectedDates);
    });

    it('특정 횟수만큼 반복되는 일정을 생성할 수 있다', () => {
      const startDate = new Date('2024-03-20');
      const interval = 1;
      const repeatCount = 3;

      const expectedDates = ['2024-03-20', '2024-03-21', '2024-03-22'];

      const dates = [];
      let currentDate = startDate;
      for (let i = 0; i < repeatCount; i++) {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addDays(currentDate, interval);
      }

      expect(dates).toEqual(expectedDates);
    });
  });
});
