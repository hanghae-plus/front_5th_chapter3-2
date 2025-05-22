import { Event, RepeatType } from '../../types';
import {
  generateDailyDates,
  generateIntervalDaily,
  generateIntervalMonthly,
  generateIntervalWeekly,
  generateMonthlyDates,
  generateWeeklyDates,
  generateYearlyDates,
} from '../../utils/repeatUtils';

describe('generateRecurrenceDates()', () => {
  describe('기본 반복 기능', () => {
    it('일정 생성 혹은 수정 시 반복 유형을 선택할 수 있다.', () => {
      const baseEvent = {
        id: '1',
        title: '회의',
        date: '2024-03-15',
        startTime: '10:00',
        endTime: '11:00',
      };

      const dailyEvent: Event = {
        ...baseEvent,
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: '2024-04-15',
        },
      };
      expect(dailyEvent.repeat?.type).toBe('daily');
    });
    it('매일 반복: 시작일 포함하여 N일치 날짜를 반환해야 한다', () => {
      const today = new Date();
      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 5);

      const dailyEvent = {
        id: '1',
        title: '데일리 스크럼',
        date: formatDate(today), // 오늘 날짜
        startTime: '10:00',
        endTime: '10:30',
        repeat: {
          type: 'daily' as RepeatType,
          interval: 1,
          endDate: formatDate(endDate), // 오늘부터 5일 후
        },
      };

      const expectedDates = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        return formatDate(date);
      });

      const generatedDates = generateDailyDates(dailyEvent);

      expect(generatedDates).toHaveLength(6); // 시작일부터 종료일까지 총 6일
      expect(generatedDates).toEqual(expectedDates);
      expect(generatedDates[0]).toBe(dailyEvent.date); // 시작일 확인
      expect(generatedDates[generatedDates.length - 1]).toBe(dailyEvent.repeat.endDate); // 종료일 확인
    });
    it('매주 반복: 시작일 포함하여 N주치 날짜를 반환해야 한다', () => {
      const today = new Date();
      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      // 4주 후의 날짜 계산
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 7 * 4); // 4주

      const weeklyEvent: Event = {
        id: '1',
        title: '주간 회의',
        date: formatDate(today),
        startTime: '14:00',
        endTime: '15:00',
        repeat: {
          type: 'weekly',
          interval: 1,
          endDate: formatDate(endDate),
        },
      };

      // 예상되는 날짜들 생성 (매주)
      const expectedDates = Array.from({ length: 5 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i * 7); // 7일씩 증가
        return formatDate(date);
      });

      const generatedWeeklyDates = generateWeeklyDates(weeklyEvent);

      console.log(generatedWeeklyDates);

      // 검증
      expect(generatedWeeklyDates).toHaveLength(5); // 시작일 포함 5개의 날짜
      expect(generatedWeeklyDates).toEqual(expectedDates);
      expect(generatedWeeklyDates[0]).toBe(weeklyEvent.date); // 시작일 확인
      expect(generatedWeeklyDates[generatedWeeklyDates.length - 1]).toBe(
        weeklyEvent.repeat.endDate
      ); // 종료일 확인
    });
    it('매월 반복: 31일 시작 시, 다음 달이 30일인 경우 마지막 날로 조정해야 한다', () => {
      const monthlyEvent: Event = {
        id: '1',
        title: '월간 회의',
        date: '2024-03-31', // 31일에 시작
        startTime: '10:00',
        endTime: '11:00',
        repeat: {
          type: 'monthly',
          interval: 1,
          endDate: '2024-06-30',
        },
      };

      const expectedDates = [
        '2024-03-31', // 3월 31일
        '2024-04-30', // 4월 30일 (4월은 30일까지)
        '2024-05-31', // 5월 31일
        '2024-06-30', // 6월 30일
      ];

      //테스트 실패 추후 적용
      const generatedMonthlyDates = generateMonthlyDates(monthlyEvent);
      console.log(generatedMonthlyDates);
      expect(generatedMonthlyDates).toEqual(expectedDates);
    });

    it('매년 반복: 윤년 2월 29일 시작 시, 평년에는 2월 28일로 조정해야 한다', () => {
      const yearlyEvent: Event = {
        id: '1',
        title: '윤년 기념일',
        date: '2024-02-29', // 2024년은 윤년
        startTime: '10:00',
        endTime: '11:00',
        repeat: {
          type: 'yearly',
          interval: 1,
          endDate: '2027-03-01', // 여러 해에 걸쳐 테스트
        },
      };

      const expectedDates = [
        '2024-02-29', // 윤년
        '2025-02-28', // 평년
        '2026-02-28', // 평년
        '2027-02-28', // 평년
      ];

      const generatedDates = generateYearlyDates(yearlyEvent);
      expect(generatedDates).toEqual(expectedDates);
    });
  });

  describe('반복 간격 설정(2일, 3주, 2개월)', () => {
    it('일간 반복 간격을 설정할 수 있다', () => {
      const dailyEvent: Event = {
        id: '1',
        title: '2일 간격 미팅',
        date: '2024-03-15',
        startTime: '10:00',
        endTime: '11:00',
        repeat: {
          type: 'daily',
          interval: 2, // 2일 간격
          endDate: '2024-03-21',
        },
      };

      // 예상 결과
      const expectedIntervalDaily = [
        '2024-03-15',
        '2024-03-17', // +2일
        '2024-03-19', // +2일
        '2024-03-21', // +2일
      ];

      expect(generateIntervalDaily(dailyEvent)).toEqual(expectedIntervalDaily);
    });

    it('주간 반복 간격을 설정할 수 있다', () => {
      const weeklyEvent: Event = {
        id: '2',
        title: '3주 간격 미팅',
        date: '2024-03-15',
        startTime: '14:00',
        endTime: '15:00',
        repeat: {
          type: 'weekly',
          interval: 3, // 3주 간격
          endDate: '2024-05-15',
        },
      };

      const expectedIntervalWeekly = [
        '2024-03-15',
        '2024-04-05', // +3주
        '2024-04-26', // +3주
      ];

      expect(generateIntervalWeekly(weeklyEvent)).toEqual(expectedIntervalWeekly);
    });

    it('월간 반복 간격을 설정할 수 있다', () => {
      const monthlyEvent: Event = {
        id: '3',
        title: '2개월 간격 미팅',
        date: '2024-03-15',
        startTime: '16:00',
        endTime: '17:00',
        repeat: {
          type: 'monthly',
          interval: 2, // 2개월 간격
          endDate: '2024-09-15',
        },
      };

      const expectedIntervalMonthly = [
        '2024-03-15',
        '2024-05-15', // +2개월
        '2024-07-15', // +2개월
        '2024-09-15', // +2개월
      ];

      expect(generateIntervalMonthly(monthlyEvent)).toEqual(expectedIntervalMonthly);
    });
  });
});
