import { Event, EventForm } from '../../types';
import { getFilteredEvents, getRepeatedEvents } from '../../utils/eventUtils';

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

describe('getRepeatedEvents', () => {
  it(`매일 반복되는 이벤트에 대해 하루 간격의 일정 배열을 반환한다.`, () => {
    const event: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2025-08-16',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-08-21' },
      notificationTime: 10,
    };

    const repeatedEvents = getRepeatedEvents(event);

    expect(repeatedEvents).toEqual([
      {
        title: '새로운 반복 이벤트',
        date: '2025-08-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-08-21' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-08-17',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-08-21' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-08-18',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-08-21' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-08-19',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-08-21' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-08-20',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-08-21' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-08-21',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-08-21' },
        notificationTime: 10,
      },
    ]);
  });
  it(`4일마다 반복되는 이벤트에 대해 4일 간격의 일정 배열을 반환한다.`, () => {
    const event: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2025-05-20',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 4, endDate: '2025-06-10' },
      notificationTime: 10,
    };

    const repeatedEvents = getRepeatedEvents(event);

    expect(repeatedEvents).toEqual([
      {
        title: '새로운 반복 이벤트',
        date: '2025-05-20',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 4, endDate: '2025-06-10' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-05-24',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 4, endDate: '2025-06-10' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-05-28',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 4, endDate: '2025-06-10' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-06-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 4, endDate: '2025-06-10' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-06-05',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 4, endDate: '2025-06-10' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-06-09',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 4, endDate: '2025-06-10' },
        notificationTime: 10,
      },
    ]);
  });
  it(`매주 반복되는 이벤트에 대해 일주일 간격의 일정 배열을 반환한다.`, () => {
    const event: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2025-04-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-05-12' },
      notificationTime: 10,
    };

    const repeatedEvents = getRepeatedEvents(event);

    expect(repeatedEvents).toEqual([
      {
        title: '새로운 반복 이벤트',
        date: '2025-04-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-05-12' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-04-22',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-05-12' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-04-29',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-05-12' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-05-06',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-05-12' },
        notificationTime: 10,
      },
    ]);
  });
  it(`2주마다 반복되는 이벤트에 대해 이주 간격의 일정 배열을 반환한다.`, () => {
    const event: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2025-08-19',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 2 },
      notificationTime: 10,
    };

    const repeatedEvents = getRepeatedEvents(event);

    expect(repeatedEvents).toEqual([
      {
        title: '새로운 반복 이벤트',
        date: '2025-08-19',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 2 },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-09-02',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 2 },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-09-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 2 },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-09-30',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 2 },
        notificationTime: 10,
      },
    ]);
  });
  it(`매월 반복되는 이벤트에 대해 한달 간격의 일정 배열을 반환한다.`, () => {
    const event: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2025-04-12',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1 },
      notificationTime: 10,
    };

    const repeatedEvents = getRepeatedEvents(event);

    expect(repeatedEvents).toEqual([
      {
        title: '새로운 반복 이벤트',
        date: '2025-04-12',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1 },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-05-12',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1 },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-06-12',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1 },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-07-12',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1 },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-08-12',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1 },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-09-12',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1 },
        notificationTime: 10,
      },
    ]);
  });
  it(`6개월 반복되는 이벤트에 대해 6개월 간격의 일정 배열을 반환한다.`, () => {
    const event: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2024-05-16',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 6 },
      notificationTime: 10,
    };

    const repeatedEvents = getRepeatedEvents(event);

    expect(repeatedEvents).toEqual([
      {
        title: '새로운 반복 이벤트',
        date: '2024-05-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 6 },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2024-11-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 6 },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-05-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 6 },
        notificationTime: 10,
      },
    ]);
  });
  it(`매년 반복되는 이벤트에 대해 일년 간격의 일정 배열을 반환한다.`, () => {
    const event: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2022-10-16',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'yearly', interval: 1 },
      notificationTime: 10,
    };

    const repeatedEvents = getRepeatedEvents(event);

    expect(repeatedEvents).toEqual([
      {
        title: '새로운 반복 이벤트',
        date: '2022-10-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 1 },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2023-10-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 1 },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2024-10-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 1 },
        notificationTime: 10,
      },
    ]);
  });
  it(`'5년 반복' 설정의 이벤트를 입력하면, 5년 간격의 일정 배열을 반환한다.`, () => {
    const event: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2010-09-30',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'yearly', interval: 5, endDate: '2035-10-10' },
      notificationTime: 10,
    };

    const repeatedEvents = getRepeatedEvents(event);

    expect(repeatedEvents).toEqual([
      {
        title: '새로운 반복 이벤트',
        date: '2010-09-30',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 5, endDate: '2035-10-10' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2015-09-30',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 5, endDate: '2035-10-10' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2020-09-30',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 5, endDate: '2035-10-10' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-09-30',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 5, endDate: '2035-10-10' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2030-09-30',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 5, endDate: '2035-10-10' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2035-09-30',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 5, endDate: '2035-10-10' },
        notificationTime: 10,
      },
    ]);
  });
  it(`'2월 29일마다 반복' 설정의 이벤트를 입력하면, 평년의 2월은 제외한 일정 배열을 반환한다.`, async () => {
    const event: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2024-02-29',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'yearly', interval: 1, endDate: '2034-03-01' },
      notificationTime: 10,
    };

    const repeatedEvents = getRepeatedEvents(event);

    expect(repeatedEvents).toEqual([
      {
        title: '새로운 반복 이벤트',
        date: '2024-02-29',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 1, endDate: '2034-03-01' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2028-02-29',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 1, endDate: '2034-03-01' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2032-02-29',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 1, endDate: '2034-03-01' },
        notificationTime: 10,
      },
    ]);
  });

  it(`'30일마다 반복' 설정의 이벤트를 입력하면, 30일이 없는 달은 제외한 일정 배열을 반환한다.`, async () => {
    const event: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2025-01-30',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-05-31' },
      notificationTime: 10,
    };

    const repeatedEvents = getRepeatedEvents(event);

    expect(repeatedEvents).toEqual([
      {
        title: '새로운 반복 이벤트',
        date: '2025-01-30',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-05-31' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-03-30',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-05-31' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-04-30',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-05-31' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-05-30',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-05-31' },
        notificationTime: 10,
      },
    ]);
  });
  it(`'31일마다 반복' 설정의 이벤트를 입력하면, 31일이 없는 달은 제외한 일정 배열을 반환한다.`, async () => {
    const event: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2025-01-31',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-07-31' },
      notificationTime: 10,
    };

    const repeatedEvents = getRepeatedEvents(event);

    expect(repeatedEvents).toEqual([
      {
        title: '새로운 반복 이벤트',
        date: '2025-01-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-07-31' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-03-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-07-31' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-05-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-07-31' },
        notificationTime: 10,
      },
      {
        title: '새로운 반복 이벤트',
        date: '2025-07-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-07-31' },
        notificationTime: 10,
      },
    ]);
  });
});
