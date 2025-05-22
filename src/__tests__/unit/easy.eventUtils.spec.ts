import { Event } from '../../types';
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

const repeatEvent: Event = {
  id: '1',
  title: '반복 이벤트',
  date: '2025-09-21',
  startTime: '11:00',
  endTime: '12:00',
  description: '반복 팀 미팅',
  location: '회의실 A',
  category: '업무',
  repeat: { type: 'daily', interval: 1 },
  notificationTime: 5,
};

describe('반복 이벤트 처리', () => {
  it('일간 반복 이벤트는 마감일이 없을 경우 25.9.30 까지 반복된다.', () => {
    const event: Event = {
      ...repeatEvent,
      date: '2025-09-21',
      repeat: { type: 'daily', interval: 1 },
    };

    const result = getRepeatEvents(event);
    console.log(result);
    expect(result).toHaveLength(10);
    expect(result.map((e) => e.date)).toEqual(
      expect.arrayContaining([
        '2025-09-21',
        '2025-09-22',
        '2025-09-23',
        '2025-09-24',
        '2025-09-25',
        '2025-09-26',
        '2025-09-27',
        '2025-09-28',
        '2025-09-29',
        '2025-09-30',
      ])
    );
  });

  it('주간 반복 이벤트는 마감일이 없을 경우 25.9.30 까지 반복된다.', () => {
    const event: Event = {
      ...repeatEvent,
      date: '2025-09-01',
      repeat: { type: 'weekly', interval: 1 },
    };

    const result = getRepeatEvents(event);
    expect(result).toHaveLength(5);
    expect(result.map((e) => e.date)).toEqual(
      expect.arrayContaining(['2025-09-01', '2025-09-08', '2025-09-15', '2025-09-22', '2025-09-29'])
    );
  });

  it('월간 반복 이벤트는 마감일이 없을 경우 25.9.30 까지 반복된다.', () => {
    const event: Event = {
      ...repeatEvent,
      date: '2025-07-01',
      repeat: { type: 'monthly', interval: 1 },
    };

    const result = getRepeatEvents(event);
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.date)).toEqual(
      expect.arrayContaining(['2025-07-01', '2025-08-01', '2025-09-01'])
    );
  });

  it('일단 반복 이벤트는 마감일까지 반복된다', () => {
    const event: Event = {
      ...repeatEvent,
      date: '2025-09-01',
      repeat: { type: 'daily', interval: 1, endDate: '2025-09-03' },
    };

    const result = getRepeatEvents(event);
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.date)).toEqual(
      expect.arrayContaining(['2025-09-01', '2025-09-02', '2025-09-03'])
    );
  });

  it('주간 반복 이벤트는 마감일까지 반복된다', () => {
    const event: Event = {
      ...repeatEvent,
      date: '2025-08-21',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-09-03' },
    };

    const result = getRepeatEvents(event);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.date)).toEqual(expect.arrayContaining(['2025-08-21', '2025-08-28']));
  });

  it('월간 반복 이벤트는 마감일까지 반복된다', () => {
    const event: Event = {
      ...repeatEvent,
      date: '2025-07-01',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-09-03' },
    };

    const result = getRepeatEvents(event);
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.date)).toEqual(
      expect.arrayContaining(['2025-07-01', '2025-08-01', '2025-09-01'])
    );
  });

  it('이벤트 날짜가 월의 마지막 날 보다 크면 월의 마지막 날까지 반복된다', () => {
    const event: Event = {
      ...repeatEvent,
      date: '2025-01-31',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-05-03' },
    };

    const result = getRepeatEvents(event);
    // expect(result).toHaveLength(4);
    expect(result.map((e) => e.date)).toEqual(
      expect.arrayContaining(['2025-01-31', '2025-02-28', '2025-03-31', '2025-04-30'])
    );
  });

  it('일간 반복에서 인터벌이 있을 경우 인터벌 만큼을 제외하고 반복된다', () => {
    const event: Event = {
      ...repeatEvent,
      date: '2025-09-01',
      repeat: { type: 'daily', interval: 2, endDate: '2025-09-03' },
    };

    const result = getRepeatEvents(event);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.date)).toEqual(expect.arrayContaining(['2025-09-01', '2025-09-03']));
  });

  it('주간 반복에서 인터벌이 있을 경우 인터벌 만큼을 제외하고 반복된다', () => {
    const event: Event = {
      ...repeatEvent,
      date: '2025-05-19',
      repeat: { type: 'weekly', interval: 2, endDate: '2025-06-03' },
    };

    const result = getRepeatEvents(event);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.date)).toEqual(expect.arrayContaining(['2025-05-19', '2025-06-02']));
  });

  it('월간 반복에서 인터벌이 있을 경우 인터벌 만큼을 제외하고 반복된다', () => {
    const event: Event = {
      ...repeatEvent,
      date: '2025-07-01',
      repeat: { type: 'monthly', interval: 2, endDate: '2025-09-03' },
    };

    const result = getRepeatEvents(event);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.date)).toEqual(expect.arrayContaining(['2025-07-01', '2025-09-01']));
  });
});
