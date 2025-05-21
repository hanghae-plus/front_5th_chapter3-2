import { EventForm } from '../../types';
import {
  createRepeatingEvents,
  isLeapYear,
  getLastDayOfMonth,
  shouldCreateEventForDate,
} from '../../utils/repeatUtils';

// 테스트 유틸리티 함수: 이벤트 객체 생성
const createTestEvent = (overrides: Partial<EventForm> = {}): EventForm => ({
  title: '테스트 이벤트',
  date: '2023-04-01', // 시작일: 2023년 4월 1일
  startTime: '10:00',
  endTime: '11:00',
  description: '테스트 설명',
  location: '테스트 장소',
  category: '업무',
  repeat: {
    type: 'none', // 기본값은 반복 없음
    interval: 1,
    endType: 'date',
  },
  notificationTime: 10,
  ...overrides,
});

// const createTestEventWithId = (id: string, overrides: Partial<EventForm> = {}): Event => ({
//   ...createTestEvent(overrides),
//   id,
// });

describe('반복 일정 유틸리티', () => {
  describe('isLeapYear', () => {
    it('4로 나누어 떨어지고 100으로 나누어 떨어지지 않는 해는 윤년이다', () => {
      expect(isLeapYear(2024)).toBe(true); // 4로 나누어지고 100으로 나누어지지 않음
      expect(isLeapYear(2028)).toBe(true);
    });

    it('100으로 나누어 떨어지지만 400으로 나누어 떨어지지 않는 해는 윤년이 아니다', () => {
      expect(isLeapYear(1900)).toBe(false); // 100으로 나누어지지만 400으로 나누어지지 않음
      expect(isLeapYear(2100)).toBe(false);
    });

    it('400으로 나누어 떨어지는 해는 윤년이다', () => {
      expect(isLeapYear(2000)).toBe(true); // 400으로 나누어짐
      expect(isLeapYear(2400)).toBe(true);
    });

    it('그 외의 해는 윤년이 아니다', () => {
      expect(isLeapYear(2023)).toBe(false); // 4로 나누어지지 않음
      expect(isLeapYear(2025)).toBe(false);
    });
  });

  describe('getLastDayOfMonth', () => {
    it('월별 마지막 날짜를 반환한다', () => {
      expect(getLastDayOfMonth(2023, 1)).toBe(31); // 1월
      expect(getLastDayOfMonth(2023, 2)).toBe(28); // 2월 (평년)
      expect(getLastDayOfMonth(2024, 2)).toBe(29); // 2월 (윤년)
      expect(getLastDayOfMonth(2023, 4)).toBe(30); // 4월
    });
  });

  describe('shouldCreateEventForDate', () => {
    const baseEvent = createTestEvent({
      date: '2023-04-15', // 4월 15일 시작
      repeat: {
        type: 'monthly',
        interval: 1,
        endType: 'date',
      },
    });

    it('매일 반복: 간격에 따라 날짜 확인', () => {
      const dailyEvent: EventForm = {
        ...baseEvent,
        repeat: { type: 'daily', interval: 2, endType: 'date' }, // 2일마다
      };

      // 같은 날(시작일)
      expect(shouldCreateEventForDate(dailyEvent, new Date('2023-04-15'))).toBe(true);
      // 2일 후
      expect(shouldCreateEventForDate(dailyEvent, new Date('2023-04-17'))).toBe(true);
      // 4일 후
      expect(shouldCreateEventForDate(dailyEvent, new Date('2023-04-19'))).toBe(true);
      // 중간 날짜 (반복 X)
      expect(shouldCreateEventForDate(dailyEvent, new Date('2023-04-16'))).toBe(false);
      expect(shouldCreateEventForDate(dailyEvent, new Date('2023-04-18'))).toBe(false);
    });

    it('매주 반복: 간격과 요일 확인', () => {
      const weeklyEvent: EventForm = {
        ...baseEvent,
        repeat: { type: 'weekly', interval: 2, endType: 'date' }, // 2주마다
      };

      // 2023-04-15는 토요일
      // 같은 날(시작일)
      expect(shouldCreateEventForDate(weeklyEvent, new Date('2023-04-15'))).toBe(true);
      // 2주 후 토요일
      expect(shouldCreateEventForDate(weeklyEvent, new Date('2023-04-29'))).toBe(true);
      // 4주 후 토요일
      expect(shouldCreateEventForDate(weeklyEvent, new Date('2023-05-13'))).toBe(true);
      // 중간 날짜 (반복 X)
      expect(shouldCreateEventForDate(weeklyEvent, new Date('2023-04-22'))).toBe(false); // 1주 후
      expect(shouldCreateEventForDate(weeklyEvent, new Date('2023-04-16'))).toBe(false); // 다음 날 (일요일)
    });

    it('매월 반복: 같은 날짜에 반복', () => {
      const monthlyEvent: EventForm = {
        ...baseEvent,
        repeat: { type: 'monthly', interval: 1, endType: 'date' }, // 매월
      };

      // 같은 날(시작일)
      expect(shouldCreateEventForDate(monthlyEvent, new Date('2023-04-15'))).toBe(true);
      // 1달 후 같은 날짜
      expect(shouldCreateEventForDate(monthlyEvent, new Date('2023-05-15'))).toBe(true);
      // 2달 후 같은 날짜
      expect(shouldCreateEventForDate(monthlyEvent, new Date('2023-06-15'))).toBe(true);
      // 다른 날짜
      expect(shouldCreateEventForDate(monthlyEvent, new Date('2023-05-14'))).toBe(false);
      expect(shouldCreateEventForDate(monthlyEvent, new Date('2023-05-16'))).toBe(false);
    });

    it('매월 반복: 매월 31일에 설정했을 때 해당 월에 31일이 없는 경우', () => {
      const monthlyEvent: EventForm = {
        ...baseEvent,
        date: '2023-01-31', // 1월 31일
        repeat: { type: 'monthly', interval: 1, endType: 'date' },
      };

      // 시작일
      expect(shouldCreateEventForDate(monthlyEvent, new Date('2023-01-31'))).toBe(true);
      // 2월은 28일까지 (2023년은 평년)
      expect(shouldCreateEventForDate(monthlyEvent, new Date('2023-02-28'))).toBe(true); // 2월 마지막 날
      expect(shouldCreateEventForDate(monthlyEvent, new Date('2023-02-27'))).toBe(false); // 2월 마지막 날 아님
      // 3월은 31일까지
      expect(shouldCreateEventForDate(monthlyEvent, new Date('2023-03-31'))).toBe(true);
      // 4월은 30일까지
      expect(shouldCreateEventForDate(monthlyEvent, new Date('2023-04-30'))).toBe(true); // 4월 마지막 날
    });

    it('매년 반복: 같은 월/일에 반복', () => {
      const yearlyEvent: EventForm = {
        ...baseEvent,
        date: '2023-02-15', // 2월 15일
        repeat: { type: 'yearly', interval: 1, endType: 'date' },
      };

      // 같은 날(시작일)
      expect(shouldCreateEventForDate(yearlyEvent, new Date('2023-02-15'))).toBe(true);
      // 1년 후 같은 날짜
      expect(shouldCreateEventForDate(yearlyEvent, new Date('2024-02-15'))).toBe(true);
      // 2년 후 같은 날짜
      expect(shouldCreateEventForDate(yearlyEvent, new Date('2025-02-15'))).toBe(true);
      // 다른 날짜
      expect(shouldCreateEventForDate(yearlyEvent, new Date('2024-02-14'))).toBe(false);
      expect(shouldCreateEventForDate(yearlyEvent, new Date('2024-03-15'))).toBe(false);
    });

    it('매년 반복: 2월 29일(윤년)에 설정했을 때', () => {
      const yearlyEvent: EventForm = {
        ...baseEvent,
        date: '2024-02-29', // 윤년의 2월 29일
        repeat: { type: 'yearly', interval: 1, endType: 'date' },
      };

      // 시작일 (윤년)
      expect(shouldCreateEventForDate(yearlyEvent, new Date('2024-02-29'))).toBe(true);
      // 1년 후 (평년): 2월 29일이 없으므로 생성하지 않음
      expect(shouldCreateEventForDate(yearlyEvent, new Date('2025-02-28'))).toBe(false);
      expect(shouldCreateEventForDate(yearlyEvent, new Date('2025-03-01'))).toBe(false);
      // 4년 후 (다음 윤년): 2월 29일
      expect(shouldCreateEventForDate(yearlyEvent, new Date('2028-02-29'))).toBe(true);
    });

    it('종료일 있는 경우: 종료일 이후에는 반복하지 않음', () => {
      const eventWithEndDate: EventForm = {
        ...baseEvent,
        repeat: {
          type: 'daily',
          interval: 1,
          endType: 'date',
          endDate: '2023-04-20',
        },
      };

      // 시작일
      expect(shouldCreateEventForDate(eventWithEndDate, new Date('2023-04-15'))).toBe(true);
      // 종료일 이내
      expect(shouldCreateEventForDate(eventWithEndDate, new Date('2023-04-19'))).toBe(true);
      expect(shouldCreateEventForDate(eventWithEndDate, new Date('2023-04-20'))).toBe(true); // 종료일 포함
      // 종료일 이후
      expect(shouldCreateEventForDate(eventWithEndDate, new Date('2023-04-21'))).toBe(false);
    });
  });

  describe('createRepeatingEvents', () => {
    it('반복 일정을 생성하여 모든 날짜에 이벤트를 생성한다', () => {
      const baseEvent = createTestEvent({
        date: '2023-04-15', // 4월 15일 시작
        repeat: {
          type: 'daily',
          interval: 2, // 2일마다
          endType: 'date',
          endDate: '2023-04-21',
        },
      });

      // 2일마다 반복하므로 4/15, 4/17, 4/19, 4/21 총 4개 이벤트 기대
      const repeatingEvents = createRepeatingEvents(baseEvent);

      expect(repeatingEvents.length).toBe(4);

      // 각 이벤트의 날짜 확인
      expect(repeatingEvents[0].date).toBe('2023-04-15');
      expect(repeatingEvents[1].date).toBe('2023-04-17');
      expect(repeatingEvents[2].date).toBe('2023-04-19');
      expect(repeatingEvents[3].date).toBe('2023-04-21');

      // 각 이벤트의 기본 정보가 동일하게 복사되었는지 확인
      repeatingEvents.forEach((event) => {
        expect(event.title).toBe(baseEvent.title);
        expect(event.startTime).toBe(baseEvent.startTime);
        expect(event.endTime).toBe(baseEvent.endTime);
        expect(event.repeat.type).toBe(baseEvent.repeat.type);
        expect(event.repeat.interval).toBe(baseEvent.repeat.interval);
      });
    });

    it('반복 일정이 아닌 경우 빈 배열을 반환한다', () => {
      const nonRepeatingEvent = createTestEvent({
        repeat: { type: 'none', interval: 1, endType: 'date' },
      });

      const events = createRepeatingEvents(nonRepeatingEvent);
      expect(events.length).toBe(0);
    });

    it('월간 반복: 31일 설정시 해당 월의 마지막 날에 생성', () => {
      const monthlyEvent = createTestEvent({
        date: '2023-01-31', // 1월 31일
        repeat: {
          type: 'monthly',
          interval: 1,
          endType: 'date',
          endDate: '2023-04-30',
        },
      });

      const repeatingEvents = createRepeatingEvents(monthlyEvent);

      // 1/31, 2/28, 3/31, 4/30 총 4개 이벤트 기대
      expect(repeatingEvents.length).toBe(4);

      expect(repeatingEvents[0].date).toBe('2023-01-31');
      expect(repeatingEvents[1].date).toBe('2023-02-28'); // 2월 마지막 날
      expect(repeatingEvents[2].date).toBe('2023-03-31');
      expect(repeatingEvents[3].date).toBe('2023-04-30');
    });

    it('연간 반복: 윤년 2월 29일 설정시 윤년에만 생성', () => {
      const yearlyEvent = createTestEvent({
        date: '2024-02-29', // 윤년의 2월 29일
        repeat: {
          type: 'yearly',
          interval: 1,
          endType: 'date',
          endDate: '2032-12-31',
        },
      });

      const repeatingEvents = createRepeatingEvents(yearlyEvent);

      // 2024, 2028, 2032 윤년에만 생성, 총 3개 이벤트 기대
      expect(repeatingEvents.length).toBe(3);

      expect(repeatingEvents[0].date).toBe('2024-02-29');
      expect(repeatingEvents[1].date).toBe('2028-02-29');
      expect(repeatingEvents[2].date).toBe('2032-02-29');
    });
  });
});
