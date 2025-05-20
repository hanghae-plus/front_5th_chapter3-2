import { Event, RepeatInfo, RepeatType } from '../../types';
import {
  generateRepeatingEvents,
  calculateNextRepeatDate,
  adjustDateForRepeat,
} from '../../utils/repeatUtils';

describe('repeatUtils', () => {
  describe('adjustDateForRepeat', () => {
    it('요청된 일이 해당 월에 존재하면 그대로 반환한다 (예: 3월 15일)', () => {
      expect(adjustDateForRepeat(2025, 2, 15, 15)).toBe('2025-03-15'); // month is 0-indexed
    });

    it('요청된 일이 해당 월의 마지막 날보다 크면 해당 월의 마지막 날로 조정한다 (예: 1월 31일 -> 2월은 28일)', () => {
      expect(adjustDateForRepeat(2025, 1, 31, 31)).toBe('2025-02-28'); // 2025년 2월
    });

    it('윤년의 2월 29일을 요청하면 2월 29일을 반환한다', () => {
      expect(adjustDateForRepeat(2024, 1, 29, 29)).toBe('2024-02-29'); // 2024년은 윤년
    });

    it('평년의 2월 29일을 요청하면 (원래 시작일이 29일) 2월 28일로 조정한다', () => {
      expect(adjustDateForRepeat(2025, 1, 29, 29)).toBe('2025-02-28');
    });

    it('4월 30일을 요청하면 (원래 시작일이 30일) 4월 30일을 반환한다', () => {
      expect(adjustDateForRepeat(2025, 3, 30, 30)).toBe('2025-04-30');
    });
    it('4월 31일을 요청하면 (원래 시작일이 31일) 4월 30일로 조정한다', () => {
      expect(adjustDateForRepeat(2025, 3, 31, 31)).toBe('2025-04-30');
    });
  });

  describe('calculateNextRepeatDate', () => {
    it('매일 반복 시 interval만큼 다음 날짜를 반환한다', () => {
      expect(calculateNextRepeatDate('2025-05-01', 'daily', 1)).toBe('2025-05-02');
      expect(calculateNextRepeatDate('2025-05-01', 'daily', 3)).toBe('2025-05-04');
      expect(calculateNextRepeatDate('2025-02-27', 'daily', 2)).toBe('2025-03-01'); // 월 변경
    });

    it('매주 반복 시 interval만큼 다음 주 같은 요일의 날짜를 반환한다', () => {
      expect(calculateNextRepeatDate('2025-05-01', 'weekly', 1)).toBe('2025-05-08'); // 7일 후
      expect(calculateNextRepeatDate('2025-05-01', 'weekly', 2)).toBe('2025-05-15'); // 14일 후
    });

    it('매월 반복 시 interval만큼 다음 달 같은 일자로 반환하며, 월말 처리를 한다', () => {
      // adjustDateForRepeat 함수가 정확하다는 가정하에, calculateNextRepeatDate는 이를 호출할 것임
      // 여기서는 다음 달로 넘어가는지만 간단히 테스트하거나, adjustDateForRepeat의 테스트에 의존
      expect(calculateNextRepeatDate('2025-01-15', 'monthly', 1)).toBe('2025-02-15');
      expect(calculateNextRepeatDate('2025-01-31', 'monthly', 1)).toBe('2025-02-28'); // 월말 조정
      expect(calculateNextRepeatDate('2024-01-31', 'monthly', 1)).toBe('2024-02-29'); // 윤년 월말 조정
      expect(calculateNextRepeatDate('2025-01-15', 'monthly', 2)).toBe('2025-03-15'); // 두 달 후
    });

    it('매년 반복 시 interval만큼 다음 해 같은 날짜로 반환하며, 윤년 월말 처리를 한다', () => {
      expect(calculateNextRepeatDate('2025-03-15', 'yearly', 1)).toBe('2026-03-15');
      expect(calculateNextRepeatDate('2024-02-29', 'yearly', 1)).toBe('2025-02-28'); // 윤년 -> 평년
      expect(calculateNextRepeatDate('2023-02-28', 'yearly', 1)).toBe('2024-02-28'); // 평년 -> 윤년 (29일로 바뀌진 않음)
      expect(calculateNextRepeatDate('2024-02-29', 'yearly', 2)).toBe('2026-02-28'); // 2년 후
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
        // id: mockRepeatGroupId // repeatInfo 자체에는 그룹 ID가 필수는 아님, generate 함수 인자로 받음
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

    it('endDate가 설정되지 않으면, 무한 반복으로 간주하여 (예제에서는) 최대 N개까지만 생성하거나 빈 배열을 반환한다 (정책 결정 필요)', () => {
      // 이 테스트는 정책에 따라 달라집니다.
      // 여기서는 endDate가 없으면 빈 배열을 반환하도록 가정 (또는 특정 최대 개수 제한)
      const noEndDateRepeatInfo: RepeatInfo = { type: 'daily', interval: 1 }; // endDate 없음
      const events = generateRepeatingEvents(
        { ...baseEventData, date: '2025-05-01' },
        noEndDateRepeatInfo,
        mockRepeatGroupId
      );
      // 예: 최대 100개까지만 생성하거나, endDate 없이는 생성하지 않도록 정책을 정하고 테스트
      // expect(events.length).toBeLessThanOrEqual(100); 또는
      expect(events).toHaveLength(0); // endDate 필수 정책이라고 가정
    });

    it('반복 간격(interval)을 고려하여 이벤트를 생성한다', () => {
      const dailyRepeatInfo: RepeatInfo = { type: 'daily', interval: 2, endDate: '2025-05-05' };
      const events = generateRepeatingEvents(
        { ...baseEventData, date: '2025-05-01' },
        dailyRepeatInfo,
        mockRepeatGroupId
      );
      expect(events).toHaveLength(3); // 5/1, 5/3, 5/5
      expect(events[0].date).toBe('2025-05-01');
      expect(events[1].date).toBe('2025-05-03');
      expect(events[2].date).toBe('2025-05-05');
    });
  });
});
