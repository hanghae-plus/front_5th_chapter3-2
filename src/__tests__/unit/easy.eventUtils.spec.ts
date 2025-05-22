import { Event } from '../../types';
import { getFilteredEvents } from '../../utils/eventUtils';
import { isRecurringEvent, getRecurringEventIcon } from '../../utils/eventUtils.ts';

describe('getFilteredEvents', () => {
  const events: Event[] = [
    {
      id: '1',
      title: '이벤트 1',
      date: '2025-07-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 0,
    },
    {
      id: '2',
      title: '이벤트 2',
      date: '2025-07-05',
      startTime: '14:00',
      endTime: '15:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 0,
    },
    {
      id: '3',
      title: '이벤트 3',
      date: '2025-07-10',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 0,
    },
  ];

  it("검색어 '이벤트 2'에 맞는 이벤트만 반환한다", () => {
    const result = getFilteredEvents(events, '이벤트 2', new Date('2025-07-01'), 'month');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('이벤트 2');
  });

  it('주간 뷰에서 2025-07-01 주의 이벤트만 반환한다', () => {
    const result = getFilteredEvents(events, '', new Date('2025-07-01'), 'week');
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.title)).toEqual(['이벤트 1', '이벤트 2']);
  });

  it('월간 뷰에서 2025년 7월의 모든 이벤트를 반환한다', () => {
    const result = getFilteredEvents(events, '', new Date('2025-07-01'), 'month');
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.title)).toEqual(['이벤트 1', '이벤트 2', '이벤트 3']);
  });

  it("검색어 '이벤트'와 주간 뷰 필터링을 동시에 적용한다", () => {
    const result = getFilteredEvents(events, '이벤트', new Date('2025-07-01'), 'week');
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.title)).toEqual(['이벤트 1', '이벤트 2']);
  });

  it('검색어가 없을 때 모든 이벤트를 반환한다', () => {
    const result = getFilteredEvents(events, '', new Date('2025-07-01'), 'month');
    expect(result).toHaveLength(3);
  });

  it('검색어가 대소문자를 구분하지 않고 작동한다', () => {
    const result = getFilteredEvents(events, '이벤트 2', new Date('2025-07-01'), 'month');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('이벤트 2');
  });

  it('월의 경계에 있는 이벤트를 올바르게 필터링한다', () => {
    const borderEvents: Event[] = [
      {
        id: '4',
        title: '6월 마지막 날 이벤트',
        date: '2025-06-30',
        startTime: '23:00',
        endTime: '23:59',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 0,
      },
      ...events,
      {
        id: '5',
        title: '8월 첫 날 이벤트',
        date: '2025-08-01',
        startTime: '00:00',
        endTime: '01:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 0,
      },
    ];
    const result = getFilteredEvents(borderEvents, '', new Date('2025-07-01'), 'month');
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.title)).toEqual(['이벤트 1', '이벤트 2', '이벤트 3']);
  });

  it('빈 이벤트 리스트에 대해 빈 배열을 반환한다', () => {
    const result = getFilteredEvents([], '', new Date('2025-07-01'), 'month');
    expect(result).toHaveLength(0);
  });
});

describe('getRecurringEventIcon', () => {
  it('반복 일정은 시각적으로 구분할 수 있는 표시 함수가 있다', async () => {
    // 각 반복 유형별 이벤트 생성
    const dailyEvent: Event = {
      id: 'daily-event',
      title: '매일 반복',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '매일 반복 테스트',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1 },
      notificationTime: 10,
    };

    const weeklyEvent: Event = {
      id: 'weekly-event',
      title: '매주 반복',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '매주 반복 테스트',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 1 },
      notificationTime: 10,
    };

    const monthlyEvent: Event = {
      id: 'monthly-event',
      title: '매월 반복',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '매월 반복 테스트',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1 },
      notificationTime: 10,
    };

    const yearlyEvent: Event = {
      id: 'yearly-event',
      title: '매년 반복',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '매년 반복 테스트',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'yearly', interval: 1 },
      notificationTime: 10,
    };

    // 일반 이벤트 (반복 없음)
    const regularEvent: Event = {
      id: 'regular-event',
      title: '일반 회의',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '일반 테스트',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };

    // isRecurringEvent 함수 테스트 - 반복 이벤트 여부 확인
    expect(isRecurringEvent(dailyEvent)).toBe(true);
    expect(isRecurringEvent(weeklyEvent)).toBe(true);
    expect(isRecurringEvent(monthlyEvent)).toBe(true);
    expect(isRecurringEvent(yearlyEvent)).toBe(true);
    expect(isRecurringEvent(regularEvent)).toBe(false);

    // getRecurringEventIcon 함수 테스트 - 각 반복 유형별 아이콘 확인
    expect(getRecurringEventIcon(dailyEvent)).toBe('🔄 매일');
    expect(getRecurringEventIcon(weeklyEvent)).toBe('🔄 매주');
    expect(getRecurringEventIcon(monthlyEvent)).toBe('🔄 매월');
    expect(getRecurringEventIcon(yearlyEvent)).toBe('🔄 매년');
    expect(getRecurringEventIcon(regularEvent)).toBeNull();

    // 간격이 다른 반복 이벤트도 올바르게 인식하는지 테스트
    const biWeeklyEvent: Event = {
      id: 'bi-weekly-event',
      title: '격주 반복',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '격주 반복 테스트',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 2 }, // 2주마다
      notificationTime: 10,
    };

    const quarterlyEvent: Event = {
      id: 'quarterly-event',
      title: '분기별 반복',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '분기별 반복 테스트',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 3 }, // 3개월마다
      notificationTime: 10,
    };

    // 간격과 상관없이 반복 유형에 따라 올바르게 구분되는지 확인
    expect(isRecurringEvent(biWeeklyEvent)).toBe(true);
    expect(isRecurringEvent(quarterlyEvent)).toBe(true);

    // 간격과 상관없이 반복 유형에 따라 올바른 아이콘이 반환되는지 확인
    expect(getRecurringEventIcon(biWeeklyEvent)).toBe('🔄 매주'); // interval과 상관없이 weekly
    expect(getRecurringEventIcon(quarterlyEvent)).toBe('🔄 매월'); // interval과 상관없이 monthly

    // endDate가 있는 반복 이벤트도 올바르게 인식하는지 테스트
    const limitedRepeatEvent: Event = {
      id: 'limited-repeat-event',
      title: '기간 제한 반복',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '기간 제한 반복 테스트',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-12-31' },
      notificationTime: 10,
    };

    expect(isRecurringEvent(limitedRepeatEvent)).toBe(true);
    expect(getRecurringEventIcon(limitedRepeatEvent)).toBe('🔄 매일');
  });
});

describe('isRecurringEvent', () => {
  it('반복 일정인지 확인하는 함수가 있다', () => {
    const event: Event = {
      id: '1',
      title: '회의',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 1 },
      notificationTime: 10,
    };

    expect(isRecurringEvent(event)).toBe(true);
  });

  it('비반복 일정인지 확인하는 함수가 있다', () => {
    const event: Event = {
      id: '2',
      title: '회의',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };

    expect(isRecurringEvent(event)).toBe(false);
  });
});
