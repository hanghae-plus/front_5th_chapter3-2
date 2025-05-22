import { Event, RepeatInfo } from '../../types';
import {
  generateRepeatingEvents,
  calculateNextRepeatDate,
  adjustDateForRepeat,
} from '../../utils/repeatUtils';

describe('repeatUtils', () => {
  describe('adjustDateForRepeat', () => {
    it('요청된 일이 해당 월에 존재하면 그대로 반환한다 (예: 3월 15일)', () => {
      expect(adjustDateForRepeat(2025, 2, 15)).toBe('2025-03-15'); // month is 0-indexed
    });

    it('요청된 일이 해당 월의 마지막 날보다 크면 해당 월의 마지막 날로 조정한다 (예: 1월 31일 -> 2월은 28일)', () => {
      expect(adjustDateForRepeat(2025, 1, 31)).toBe('2025-02-28'); // 2025년 2월
    });

    it('윤년의 2월 29일을 요청하면 2월 29일을 반환한다', () => {
      expect(adjustDateForRepeat(2024, 1, 29)).toBe('2024-02-29'); // 2024년은 윤년
    });

    it('평년의 2월 29일을 요청하면 (원래 시작일이 29일) 2월 28일로 조정한다', () => {
      expect(adjustDateForRepeat(2025, 1, 29)).toBe('2025-02-28');
    });

    it('4월 30일을 요청하면 (원래 시작일이 30일) 4월 30일을 반환한다', () => {
      expect(adjustDateForRepeat(2025, 3, 30)).toBe('2025-04-30');
    });
    it('4월 31일을 요청하면 (원래 시작일이 31일) 4월 30일로 조정한다', () => {
      expect(adjustDateForRepeat(2025, 3, 31)).toBe('2025-04-30');
    });
  });

  describe('calculateNextRepeatDate', () => {
    it('매일 반복 시 interval만큼 다음 날짜를 반환한다', () => {
      // 일일 반복은 originalStartDay의 영향이 적지만, 일관성을 위해 전달
      expect(calculateNextRepeatDate('2025-05-01', 'daily', 1, 1)).toBe('2025-05-02');
      expect(calculateNextRepeatDate('2025-05-01', 'daily', 3, 1)).toBe('2025-05-04');
      expect(calculateNextRepeatDate('2025-02-27', 'daily', 2, 27)).toBe('2025-03-01');
    });

    it('매주 반복 시 interval만큼 다음 주 같은 요일의 날짜를 반환한다', () => {
      // 주간 반복도 originalStartDay의 영향이 적음
      expect(calculateNextRepeatDate('2025-05-01', 'weekly', 1, 1)).toBe('2025-05-08');
      expect(calculateNextRepeatDate('2025-05-01', 'weekly', 2, 1)).toBe('2025-05-15');
    });

    it('매월 반복 시 interval만큼 다음 달 같은 일자로 반환하며, 월말 처리를 한다', () => {
      expect(calculateNextRepeatDate('2025-01-15', 'monthly', 1, 15)).toBe('2025-02-15');
      expect(calculateNextRepeatDate('2025-01-31', 'monthly', 1, 31)).toBe('2025-02-28'); // 월말 조정
      expect(calculateNextRepeatDate('2024-01-31', 'monthly', 1, 31)).toBe('2024-02-29'); // 윤년 월말 조정
      expect(calculateNextRepeatDate('2025-01-15', 'monthly', 2, 15)).toBe('2025-03-15');
      // 실패했던 케이스와 유사한 상황: 2월 28일 다음 +1달 (원래 시작일 31일) -> 3월 31일 기대
      expect(calculateNextRepeatDate('2025-02-28', 'monthly', 1, 31)).toBe('2025-03-31');
      expect(calculateNextRepeatDate('2025-11-15', 'monthly', 3, 15)).toBe('2026-02-15'); // 연도 변경
      expect(calculateNextRepeatDate('2025-10-31', 'monthly', 4, 31)).toBe('2026-02-28'); // 연도 변경 및 월말 조정 (평년)
      expect(calculateNextRepeatDate('2023-10-31', 'monthly', 4, 31)).toBe('2024-02-29'); // 연도 변경 및 월말 조정 (윤년)
    });

    it('매년 반복 시 interval만큼 다음 해 같은 날짜로 반환하며, 윤년 월말 처리를 한다', () => {
      expect(calculateNextRepeatDate('2025-03-15', 'yearly', 1, 15)).toBe('2026-03-15');
      expect(calculateNextRepeatDate('2024-02-29', 'yearly', 1, 29)).toBe('2025-02-28');
      expect(calculateNextRepeatDate('2023-02-28', 'yearly', 1, 28)).toBe('2024-02-28');
      expect(calculateNextRepeatDate('2024-02-29', 'yearly', 2, 29)).toBe('2026-02-28');
      expect(calculateNextRepeatDate('2024-02-29', 'yearly', 4, 29)).toBe('2028-02-29'); // 윤년 -> 윤년
    });
  });

  describe('generateRepeatingEvents', () => {
    const baseEventData: Omit<Event, 'id' | 'repeat'> = {
      // id와 repeat는 테스트마다 다르게 설정
      title: '테스트 이벤트',
      date: 'placeholder-date',
      startTime: '10:00',
      endTime: '11:00',
      description: '설명',
      location: '장소',
      category: '업무',
      notificationTime: 10,
    };
    const mockRepeatGroupId = 'test-group-1';

    it('매일 반복 설정을 기반으로 올바른 이벤트 목록을 생성한다', () => {
      const dailyRepeatInfo: RepeatInfo = {
        type: 'daily',
        interval: 1,
        endDate: '2025-05-03',
      };
      const events = generateRepeatingEvents(
        { ...baseEventData, date: '2025-05-01' },
        dailyRepeatInfo,
        mockRepeatGroupId
      );
      expect(events).toHaveLength(3); // 5/1, 5/2, 5/3
      expect(events[0].date).toBe('2025-05-01');
      expect(events[1].date).toBe('2025-05-02');
      expect(events[2].date).toBe('2025-05-03');
      expect(events.every((event) => event.repeat.id === mockRepeatGroupId)).toBe(true);
      expect(events.every((event) => event.repeat.type === 'daily')).toBe(true);
    });

    it('매주 반복 설정을 기반으로 올바른 이벤트 목록을 생성한다', () => {
      const weeklyRepeatInfo: RepeatInfo = { type: 'weekly', interval: 1, endDate: '2025-05-15' };
      const events = generateRepeatingEvents(
        { ...baseEventData, date: '2025-05-01' }, // 목요일
        weeklyRepeatInfo,
        mockRepeatGroupId
      );
      expect(events).toHaveLength(3); // 5/1, 5/8, 5/15
      expect(events[0].date).toBe('2025-05-01');
      expect(events[1].date).toBe('2025-05-08');
      expect(events[2].date).toBe('2025-05-15');
    });

    it('매월 반복 설정을 기반으로 올바른 이벤트 목록을 생성하며, 월말을 고려한다', () => {
      const monthlyRepeatInfo: RepeatInfo = { type: 'monthly', interval: 1, endDate: '2025-04-30' };
      const events = generateRepeatingEvents(
        { ...baseEventData, date: '2025-01-31' },
        monthlyRepeatInfo,
        mockRepeatGroupId
      );
      expect(events).toHaveLength(4); // 1/31, 2/28, 3/31, 4/30
      expect(events[0].date).toBe('2025-01-31');
      expect(events[1].date).toBe('2025-02-28');
      expect(events[2].date).toBe('2025-03-31');
      expect(events[3].date).toBe('2025-04-30');
    });

    it('매년 반복 설정을 기반으로 올바른 이벤트 목록을 생성하며, 윤년을 고려한다', () => {
      const yearlyRepeatInfo: RepeatInfo = { type: 'yearly', interval: 1, endDate: '2026-02-28' };
      const events = generateRepeatingEvents(
        { ...baseEventData, date: '2024-02-29' }, // 윤년
        yearlyRepeatInfo,
        mockRepeatGroupId
      );
      expect(events).toHaveLength(3); // 2024-02-29, 2025-02-28, 2026-02-28
      expect(events[0].date).toBe('2024-02-29');
      expect(events[1].date).toBe('2025-02-28');
      expect(events[2].date).toBe('2026-02-28');
    });

    it('endDate가 설정되지 않으면, 무한 반복으로 간주하여 (예제에서는) 최대 N개까지만 생성하거나 빈 배열을 반환한다', () => {
      const noEndDateRepeatInfo: RepeatInfo = { type: 'daily', interval: 1 }; // endDate 없음
      const events = generateRepeatingEvents(
        { ...baseEventData, date: '2025-05-01' },
        noEndDateRepeatInfo,
        mockRepeatGroupId
      );
      // 현재 generateRepeatingEvents 함수는 endDate가 없으면 빈 배열을 반환하도록 되어 있습니다.
      expect(events).toHaveLength(0);
    });

    // --- 반복 간격(interval) 관련 테스트 케이스 추가/확장 ---
    it('generateRepeatingEvents 함수는 다양한 반복 간격을 고려하여 이벤트를 생성해야 한다', () => {
      // 매일, 간격 2일
      const dailyIntervalEvents = generateRepeatingEvents(
        { ...baseEventData, date: '2025-05-01' },
        { type: 'daily', interval: 2, endDate: '2025-05-06' }, // 5/1, 5/3, 5/5
        mockRepeatGroupId
      );
      expect(dailyIntervalEvents).toHaveLength(3);
      expect(dailyIntervalEvents.map((e) => e.date)).toEqual([
        '2025-05-01',
        '2025-05-03',
        '2025-05-05',
      ]);

      // 매주, 간격 2주
      const weeklyIntervalEvents = generateRepeatingEvents(
        { ...baseEventData, date: '2025-05-01' }, // 목요일
        { type: 'weekly', interval: 2, endDate: '2025-05-29' }, // 5/1, 5/15, 5/29
        mockRepeatGroupId
      );
      expect(weeklyIntervalEvents).toHaveLength(3);
      expect(weeklyIntervalEvents.map((e) => e.date)).toEqual([
        '2025-05-01',
        '2025-05-15',
        '2025-05-29',
      ]);

      // 매월, 간격 3개월, 월말 처리
      const monthlyIntervalEvents = generateRepeatingEvents(
        { ...baseEventData, date: '2025-01-31' },
        { type: 'monthly', interval: 3, endDate: '2025-08-01' }, // 1/31, 4/30, 7/31
        mockRepeatGroupId
      );
      expect(monthlyIntervalEvents).toHaveLength(3);
      expect(monthlyIntervalEvents.map((e) => e.date)).toEqual([
        '2025-01-31',
        '2025-04-30',
        '2025-07-31',
      ]);

      // 매년, 간격 2년, 윤년 시작
      const yearlyIntervalEvents = generateRepeatingEvents(
        { ...baseEventData, date: '2024-02-29' },
        { type: 'yearly', interval: 2, endDate: '2029-01-01' }, // 2024-02-29, 2026-02-28, 2028-02-29
        mockRepeatGroupId
      );
      expect(yearlyIntervalEvents).toHaveLength(3);
      expect(yearlyIntervalEvents.map((e) => e.date)).toEqual([
        '2024-02-29',
        '2026-02-28',
        '2028-02-29',
      ]);
    });

    it('반복 종료일(endDate)을 정확히 지켜 이벤트를 생성해야 한다', () => {
      const events = generateRepeatingEvents(
        { ...baseEventData, date: '2025-12-30' },
        { type: 'daily', interval: 1, endDate: '2026-01-01' }, // 12/30, 12/31, 1/1
        mockRepeatGroupId
      );
      expect(events).toHaveLength(3);
      expect(events.map((e) => e.date)).toEqual(['2025-12-30', '2025-12-31', '2026-01-01']);
    });
  });
});
