import { Event, EventForm } from '../../types';
import { getFilteredEvents, getRepeatEvents } from '../../utils/eventUtils';

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

describe('getRepeatEvents', () => {
  it('매일 반복 이벤트를 생성한다. (endDate 없음)', () => {
    const event: EventForm = {
      title: '이벤트 1',
      date: '2025-05-23',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'daily', interval: 1 },
      notificationTime: 0,
    };

    const result = getRepeatEvents(event);
    expect(result).toHaveLength(131);
  });

  it('매일 반복 이벤트를 생성한다. (endDate 있음)', () => {
    const event: EventForm = {
      title: '이벤트 1',
      date: '2025-05-23',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'daily', interval: 1, endDate: '2025-06-23' },
      notificationTime: 0,
    };

    const result = getRepeatEvents(event);
    expect(result).toHaveLength(32);
    expect(result[result.length - 1].date).toBe('2025-06-23');
  });

  it('매일 반복 이벤트를 생성한다. (endDate 있음. 간격 3일)', () => {
    const event: EventForm = {
      title: '이벤트 1',
      date: '2025-05-23',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'daily', interval: 3, endDate: '2025-06-23' },
      notificationTime: 0,
    };

    const result = getRepeatEvents(event);

    expect(result).toHaveLength(11);
    expect(result[result.length - 1].date).toBe('2025-06-22');
  });

  it('매주 반복 이벤트를 생성한다. (endDate 없음)', () => {
    const event: EventForm = {
      title: '이벤트 1',
      date: '2025-05-23',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'weekly', interval: 1 },
      notificationTime: 0,
    };

    const result = getRepeatEvents(event);
    expect(result).toHaveLength(19);
    expect(result[result.length - 1].date).toBe('2025-09-26');
  });

  it('매주 반복 이벤트를 생성한다. (endDate 있음. 간격 2주)', () => {
    const event: EventForm = {
      title: '이벤트 1',
      date: '2025-05-23',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'weekly', interval: 2, endDate: '2025-08-23' },
      notificationTime: 0,
    };

    const result = getRepeatEvents(event);

    expect(result).toHaveLength(7);
    expect(result[result.length - 1].date).toBe('2025-08-15');
  });

  it('매월 반복 이벤트를 생성한다. (endDate 없음)', () => {
    const event: EventForm = {
      title: '이벤트 1',
      date: '2025-05-23',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'monthly', interval: 1 },
      notificationTime: 0,
    };

    const result = getRepeatEvents(event);
    expect(result).toHaveLength(5);
    expect(result[result.length - 1].date).toBe('2025-09-23');
  });

  it('매월 반복 이벤트를 생성한다. (endDate 있음. 간격 2개월)', () => {
    const event: EventForm = {
      title: '이벤트 1',
      date: '2025-05-23',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'monthly', interval: 2, endDate: '2025-12-23' },
      notificationTime: 0,
    };

    const result = getRepeatEvents(event);
    expect(result).toHaveLength(4);
    expect(result[result.length - 1].date).toBe('2025-11-23');
  });

  it('매년 반복 이벤트를 생성한다. (endDate 없음)', () => {
    const event: EventForm = {
      title: '이벤트 1',
      date: '2025-05-23',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'yearly', interval: 1 },
      notificationTime: 0,
    };

    const result = getRepeatEvents(event);
    expect(result).toHaveLength(1);
    expect(result[result.length - 1].date).toBe('2025-05-23');
  });

  it('매년 반복 이벤트를 생성한다. (endDate 있음. 간격 2년)', () => {
    const event: EventForm = {
      title: '이벤트 1',
      date: '2025-05-23',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'yearly', interval: 2, endDate: '2033-05-23' },
      notificationTime: 0,
    };

    const result = getRepeatEvents(event);
    expect(result).toHaveLength(5);
    expect(result[result.length - 1].date).toBe('2033-05-23');
  });

  it('윤년 처리(2월 29일) 테스트', () => {
    const event: EventForm = {
      title: '이벤트 1',
      date: '2024-02-29',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'yearly', interval: 1, endDate: '2029-04-30' },
      notificationTime: 0,
    };

    const result = getRepeatEvents(event);
    expect(result).toHaveLength(6);
    expect(result[0].date).toBe('2024-02-29');
    expect(result[1].date).toBe('2025-02-28');
    expect(result[2].date).toBe('2026-02-28');
    expect(result[3].date).toBe('2027-02-28');
    expect(result[4].date).toBe('2028-02-29');
    expect(result[5].date).toBe('2029-02-28');
  });

  it('월말 처리(30일) 테스트', () => {
    const event: EventForm = {
      title: '이벤트 1',
      date: '2025-01-30',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-12-31' },
      notificationTime: 0,
    };

    const result = getRepeatEvents(event);
    expect(result).toHaveLength(12);

    expect(result[0].date).toBe('2025-01-30');
    expect(result[1].date).toBe('2025-02-28');
    expect(result[2].date).toBe('2025-03-30');
    expect(result[3].date).toBe('2025-04-30');
    expect(result[4].date).toBe('2025-05-30');
    expect(result[5].date).toBe('2025-06-30');
    expect(result[6].date).toBe('2025-07-30');
    expect(result[7].date).toBe('2025-08-30');
    expect(result[8].date).toBe('2025-09-30');
    expect(result[9].date).toBe('2025-10-30');
    expect(result[10].date).toBe('2025-11-30');
    expect(result[11].date).toBe('2025-12-30');
  });

  it('월말 처리(31일) 테스트', () => {
    const event: EventForm = {
      title: '이벤트 1',
      date: '2025-01-31',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-12-31' },
      notificationTime: 0,
    };

    const result = getRepeatEvents(event);
    expect(result).toHaveLength(12);

    expect(result[0].date).toBe('2025-01-31');
    expect(result[1].date).toBe('2025-02-28');
    expect(result[2].date).toBe('2025-03-31');
    expect(result[3].date).toBe('2025-04-30');
    expect(result[4].date).toBe('2025-05-31');
    expect(result[5].date).toBe('2025-06-30');
    expect(result[6].date).toBe('2025-07-31');
    expect(result[7].date).toBe('2025-08-31');
    expect(result[8].date).toBe('2025-09-30');
    expect(result[9].date).toBe('2025-10-31');
    expect(result[10].date).toBe('2025-11-30');
    expect(result[11].date).toBe('2025-12-31');
  });
});

describe('eventUtils의 내부 함수들', () => {
  describe('날짜 범위 필터링', () => {
    const events: Event[] = [
      {
        id: '1',
        title: '이벤트 1',
        date: '2025-05-01',
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
        date: '2025-05-15',
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
        date: '2025-05-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 0,
      },
    ];

    it('주어진 날짜 범위 내의 이벤트만 필터링한다', () => {
      const start = new Date('2025-05-01');
      const result = getFilteredEvents(events, '', start, 'month');
      expect(result).toHaveLength(3);
      expect(result.map((e) => e.title)).toEqual(['이벤트 1', '이벤트 2', '이벤트 3']);
    });
  });

  describe('검색어 포함 여부 확인', () => {
    it('대소문자를 구분하지 않고 검색어를 찾는다', () => {
      const events: Event[] = [
        {
          id: '1',
          title: 'Test Event',
          date: '2025-05-01',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 0,
        },
      ];
      const result = getFilteredEvents(events, 'test', new Date('2025-05-01'), 'month');
      expect(result).toHaveLength(1);
    });
  });

  describe('이벤트 검색', () => {
    const events: Event[] = [
      {
        id: '1',
        title: '회의',
        date: '2025-05-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '팀 회의',
        location: '회의실',
        category: '',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 0,
      },
    ];

    it('제목, 설명, 위치에서 검색어를 찾는다', () => {
      const result = getFilteredEvents(events, '회의', new Date('2025-05-01'), 'month');
      expect(result).toHaveLength(1);
    });

    it('검색어가 없을 때 모든 이벤트를 반환한다', () => {
      const result = getFilteredEvents(events, '', new Date('2025-05-01'), 'month');
      expect(result).toHaveLength(1);
    });
  });

  describe('주간 날짜 범위 필터링', () => {
    const events: Event[] = [
      {
        id: '1',
        title: '월요일 이벤트',
        date: '2025-05-05',
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
        title: '일요일 이벤트',
        date: '2025-05-11',
        startTime: '14:00',
        endTime: '15:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 0,
      },
    ];

    it('주어진 날짜가 속한 주의 이벤트만 필터링한다', () => {
      const result = getFilteredEvents(events, '', new Date('2025-05-05'), 'week');
      expect(result).toHaveLength(1);
    });
  });

  describe('월간 날짜 범위 필터링', () => {
    const events: Event[] = [
      {
        id: '1',
        title: '5월 이벤트',
        date: '2025-05-01',
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
        title: '6월 이벤트',
        date: '2025-06-01',
        startTime: '14:00',
        endTime: '15:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 0,
      },
    ];

    it('주어진 날짜가 속한 달의 이벤트만 필터링한다', () => {
      const result = getFilteredEvents(events, '', new Date('2025-05-15'), 'month');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('5월 이벤트');
    });
  });

  describe('유효한 날짜 계산', () => {
    it('윤년의 2월 29일을 올바르게 처리한다', () => {
      const event: EventForm = {
        title: '이벤트',
        date: '2024-02-29',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'yearly', interval: 1, endDate: '2025-02-28' },
        notificationTime: 0,
      };
      const result = getRepeatEvents(event);
      expect(result[1].date).toBe('2025-02-28');
    });

    it('31일이 없는 달의 마지막 날을 올바르게 처리한다', () => {
      const event: EventForm = {
        title: '이벤트',
        date: '2025-01-31',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-02-28' },
        notificationTime: 0,
      };
      const result = getRepeatEvents(event);
      expect(result[1].date).toBe('2025-02-28');
    });
  });
});
