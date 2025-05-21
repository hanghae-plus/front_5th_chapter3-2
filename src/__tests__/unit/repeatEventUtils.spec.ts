import { Event } from '../../types';
import { generateRecurringEvents } from '../../utils/repeatEventUtils';

describe('repeatEventUtils', () => {
  const event: Event = {
    id: '1',
    title: '매일 반복 이벤트',
    date: '2025-05-20',
    startTime: '10:00',
    endTime: '11:00',
    repeat: {
      type: 'daily',
      interval: 1,
      endType: 'date',
      endDate: '2025-05-27',
    },
    description: '',
    location: '',
    category: '',
    notificationTime: 0,
    isRecurring: false,
  };

  describe('반복 유형별 테스트', () => {
    it('매일 반복일정을 생성한다.', () => {
      const dailyEvent: Event = {
        id: '1',
        title: '매일 반복 이벤트',
        date: '2025-05-20',
        startTime: '10:00',
        endTime: '11:00',
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: '2025-05-23',
          endType: 'date',
        },
        description: '',
        location: '',
        category: '',
        notificationTime: 0,
        isRecurring: true,
      };

      const expected = [
        {
          ...dailyEvent,
          date: '2025-05-20',
        },
        {
          ...dailyEvent,
          date: '2025-05-21',
        },
        {
          ...dailyEvent,
          date: '2025-05-22',
        },
        {
          ...dailyEvent,
          date: '2025-05-23',
        },
      ];

      const result = generateRecurringEvents(dailyEvent);
      expect(result).toEqual(expected);
    });

    it('매주 반복일정을 생성한다.', () => {
      const weeklyEvent: Event = {
        id: '1',
        title: '매주 반복 이벤트',
        date: '2025-05-20',
        startTime: '10:00',
        endTime: '11:00',
        repeat: {
          type: 'weekly',
          interval: 1,
          endDate: '2025-05-27',
          endType: 'date',
        },
        description: '',
        location: '',
        category: '',
        notificationTime: 0,
        isRecurring: true,
      };

      const expected = [
        {
          ...weeklyEvent,
          date: '2025-05-20',
        },
        {
          ...weeklyEvent,
          date: '2025-05-27',
        },
      ];

      const result = generateRecurringEvents(weeklyEvent);
      expect(result).toEqual(expected);
    });

    it('매월 반복일정을 생성한다.', () => {
      const monthlyEvent: Event = {
        id: '1',
        title: '매주 반복 이벤트',
        date: '2025-05-20',
        startTime: '10:00',
        endTime: '11:00',
        repeat: {
          type: 'monthly',
          interval: 1,
          endDate: '2025-06-20',
          endType: 'date',
        },
        description: '',
        location: '',
        category: '',
        notificationTime: 0,
        isRecurring: true,
      };

      const expected = [
        {
          ...monthlyEvent,
          date: '2025-05-20',
        },
        {
          ...monthlyEvent,
          date: '2025-06-20',
        },
      ];

      const result = generateRecurringEvents(monthlyEvent);
      expect(result).toEqual(expected);
    });

    it('매년 반복일정을 생성한다.', () => {
      const yearlyEvent: Event = {
        id: '1',
        title: '매년 반복 이벤트',
        date: '2025-05-20',
        startTime: '10:00',
        endTime: '11:00',
        repeat: {
          type: 'yearly',
          interval: 1,
          endDate: '2026-05-20',
          endType: 'date',
        },
        description: '',
        location: '',
        category: '',
        notificationTime: 0,
        isRecurring: true,
      };

      const expected = [
        {
          ...yearlyEvent,
          date: '2025-05-20',
        },
        {
          ...yearlyEvent,
          date: '2026-05-20',
        },
      ];

      const result = generateRecurringEvents(yearlyEvent);
      expect(result).toEqual(expected);
    });
  });

  describe('예외 처리', () => {
    it('반복 간격이 0 이하인 경우 빈 배열을 반환한다', () => {
      const invalidEvent: Event = {
        ...event,
        repeat: {
          type: 'daily',
          interval: 0,
          endDate: '2025-05-20',
          endType: 'date',
        },
        isRecurring: true,
      };
      const result = generateRecurringEvents(invalidEvent);
      expect(result).toEqual([]);
    });

    it('종료일이 시작일보다 이전인 경우 빈 배열을 반환한다', () => {
      const invalidEvent: Event = {
        ...event,
        date: '2025-05-20',
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: '2025-05-19',
          endType: 'date',
        },
        isRecurring: true,
      };
      const result = generateRecurringEvents(invalidEvent);
      expect(result).toEqual([]);
    });

    it('반복 유형이 없는 경우 예외 처리', () => {
      const invalidEvent: Event = {
        ...event,
        repeat: {
          type: 'none' as const,
          interval: 0,
          endDate: '2025-05-20',
          endType: 'date',
        },
        isRecurring: false,
      };

      const expected = [{ ...invalidEvent }];
      const result = generateRecurringEvents(invalidEvent);
      expect(result).toEqual(expected);
    });
  });

  // 간격 적용
  it('반복 간격이 1인 경우 매일 반복', () => {
    const repeatEvent: Event = {
      ...event,
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-05-20',
        endType: 'date',
      },
      isRecurring: true,
    };

    const expected = [
      {
        ...repeatEvent,
        date: '2025-05-20',
      },
    ];
    const result = generateRecurringEvents(repeatEvent);
    expect(result).toEqual(expected);
  });

  // 종료 처리
  it('2025-09-30까지 반복 종료일정을 생성한다.', () => {
    const repeatEvent: Event = {
      ...event,
      repeat: {
        type: 'yearly',
        interval: 1,
        endDate: '2025-09-30',
        endType: 'date',
      },
      isRecurring: true,
    };

    const expected = [
      {
        ...repeatEvent,
        date: '2025-05-20',
      },
    ];
    const result = generateRecurringEvents(repeatEvent);
    expect(result).toEqual(expected);
  });

  it('2월 29일 윤년 반복은 일반년에 28일로 보정된다', () => {
    const repeatEvent: Event = {
      ...event,
      date: '2024-02-29',
      repeat: {
        type: 'yearly',
        interval: 1,
        endDate: '2027-02-28',
        endType: 'date',
      },
      isRecurring: true,
    };

    const expected = [
      {
        ...repeatEvent,
        date: '2024-02-29', // 2024년 윤년
      },
      {
        ...repeatEvent,
        date: '2025-02-28', // 2025년 평년
      },
      {
        ...repeatEvent,
        date: '2026-02-28', // 2026년 평년
      },
      {
        ...repeatEvent,
        date: '2027-02-28', // 2027년 평년
      },
    ];

    const result = generateRecurringEvents(repeatEvent);
    expect(result).toEqual(expected);
  });

  describe('종료 조건별 테스트', () => {
    it('종료 횟수(count)로 반복일정을 생성한다', () => {
      const countEvent: Event = {
        ...event,
        repeat: {
          type: 'daily',
          interval: 1,
          endType: 'count',
          endCount: 3,
        },
        isRecurring: true,
      };

      const expected = [
        {
          ...countEvent,
          date: '2025-05-20',
        },
        {
          ...countEvent,
          date: '2025-05-21',
        },
        {
          ...countEvent,
          date: '2025-05-22',
        },
      ];

      const result = generateRecurringEvents(countEvent);
      expect(result).toEqual(expected);
    });

    it('종료일이 없고 종료 횟수도 없는 경우 2025년 9월 30일까지 일정만 생성한다', () => {
      const infiniteEvent: Event = {
        ...event,
        date: '2025-05-20',
        repeat: {
          type: 'daily',
          interval: 1,
          endType: 'none',
        },
        isRecurring: true,
      };

      const result = generateRecurringEvents(infiniteEvent);
      const lastDate = result[result.length - 1].date;

      expect(result.length).toBeGreaterThan(0);
      expect(lastDate).toBe('2025-09-30');
    });

    it('종료 횟수가 0 이하인 경우 빈 배열을 반환한다', () => {
      const invalidCountEvent: Event = {
        ...event,
        repeat: {
          type: 'daily',
          interval: 1,
          endType: 'count',
          endCount: 0,
        },
        isRecurring: true,
      };

      const result = generateRecurringEvents(invalidCountEvent);
      expect(result).toEqual([]);
    });
  });
});
