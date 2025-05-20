import { Event } from '../types';
import { getRepeatingEvents } from '../utils/getRepeatingEvents';

describe('매일 반복', () => {
  it('등록한 일정이 매일 반복된다.', () => {
    const event: Event = {
      id: '2',
      title: 'test title',
      date: '2025-05-19',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'daily', interval: 0 },
      notificationTime: 1,
    };

    const result = getRepeatingEvents(event);

    expect(result).toContainEqual({
      id: 'fixed-id',
      title: 'test title',
      date: '2025-05-20',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'daily', interval: 0 },
      notificationTime: 1,
    });
  });

  it('등록한 일정이 2일마다 반복된다.', () => {
    const event: Event = {
      id: '2',
      title: 'test title',
      date: '2025-05-19',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'daily', interval: 2 },
      notificationTime: 1,
    };

    const result = getRepeatingEvents(event);

    expect(result).not.toContainEqual({
      id: 'fixed-id',
      title: 'test title',
      date: '2025-05-20',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'daily', interval: 2 },
      notificationTime: 1,
    });
  });

  it('등록한 일정이 2025-09-30까지만 반복된다', () => {
    const event: Event = {
      id: '2',
      title: 'test title',
      date: '2025-08-24',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'daily', interval: 0, endDate: '2025-09-30' },
      notificationTime: 1,
    };

    const result = getRepeatingEvents(event);

    expect(result.length).toBe(38);

    expect(result).not.toContainEqual({
      id: 'fixed-id',
      title: 'test title',
      date: '2025-10-01',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'daily', interval: 2, endDate: '2025-09-30' },
      notificationTime: 1,
    });
  });

  it('등록한 일정이 2025-09-30까지만 5일주기로 반복된다', () => {
    const event: Event = {
      id: '2',
      title: 'test title',
      date: '2025-08-01',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'daily', interval: 5, endDate: '2025-09-30' },
      notificationTime: 1,
    };

    const result = getRepeatingEvents(event);

    expect(result).not.toContainEqual({
      id: 'fixed-id',
      title: 'test title',
      date: '2025-10-01',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'daily', interval: 5, endDate: '2025-09-30' },
      notificationTime: 1,
    });
  });
});

describe('매주 반복', () => {
  it('등록한 일정이 매주 반복된다.', () => {
    const event: Event = {
      id: '2',
      title: 'test title',
      date: '2025-05-19',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'weekly', interval: 0 },
      notificationTime: 1,
    };
    const result = getRepeatingEvents(event);

    expect(result).toContainEqual({
      id: 'fixed-id',
      title: 'test title',
      date: '2025-05-26',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'weekly', interval: 0 },
      notificationTime: 1,
    });
  });

  it('등록한 일정이 2주마다 반복된다.', () => {
    const event: Event = {
      id: '2',
      title: 'test title',
      date: '2025-05-19',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'weekly', interval: 2 },
      notificationTime: 1,
    };
    const result = getRepeatingEvents(event);

    expect(result).not.toContainEqual({
      id: 'fixed-id',
      title: 'test title',
      date: '2025-05-26',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'weekly', interval: 2 },
      notificationTime: 1,
    });
  });

  it('등록한 일정이 2025-09-30까지만 매주 반복된다', () => {
    const event: Event = {
      id: '2',
      title: 'test title',
      date: '2025-08-01',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'weekly', interval: 0, endDate: '2025-09-30' },
      notificationTime: 1,
    };

    const result = getRepeatingEvents(event);

    expect(result.length).toBe(9);

    expect(result).not.toContainEqual({
      id: 'fixed-id',
      title: 'test title',
      date: '2025-08-02',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'weekly', interval: 0, endDate: '2025-09-30' },
      notificationTime: 1,
    });
  });

  it('등록한 일정이 2025-09-30까지만 2주 간격으로 반복된다', () => {
    const event: Event = {
      id: '2',
      title: 'test title',
      date: '2025-08-01',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'weekly', interval: 2, endDate: '2025-09-30' },
      notificationTime: 1,
    };

    const result = getRepeatingEvents(event);

    expect(result.length).toBe(5);

    expect(result).not.toContainEqual({
      id: 'fixed-id',
      title: 'test title',
      date: '2025-08-08',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'weekly', interval: 2, endDate: '2025-09-30' },
      notificationTime: 1,
    });
  });
});

describe('매월 반복', () => {
  it('등록한 일정이 매월 반복된다.', () => {
    const event: Event = {
      id: '2',
      title: 'test title',
      date: '2025-05-19',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'monthly', interval: 0 },
      notificationTime: 1,
    };
    const result = getRepeatingEvents(event);

    expect(result).toContainEqual({
      id: 'fixed-id',
      title: 'test title',
      date: '2025-06-19',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'monthly', interval: 0 },
      notificationTime: 1,
    });
  });

  it('등록한 일정이 2달마다 반복된다.', () => {
    const event: Event = {
      id: '2',
      title: 'test title',
      date: '2025-05-19',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'monthly', interval: 2 },
      notificationTime: 1,
    };
    const result = getRepeatingEvents(event);

    expect(result).toContainEqual({
      id: 'fixed-id',
      title: 'test title',
      date: '2025-07-19',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'monthly', interval: 2 },
      notificationTime: 1,
    });
  });

  it('등록한 일정이 윤년 29일이면 매월 29일에 반복된다.', () => {
    const event: Event = {
      id: '2',
      title: 'test title',
      date: '2028-02-29',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'monthly', interval: 0 },
      notificationTime: 1,
    };
    const result = getRepeatingEvents(event);

    expect(result).toContainEqual({
      id: 'fixed-id',
      title: 'test title',
      date: '2028-03-29',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'monthly', interval: 0 },
      notificationTime: 1,
    });
  });

  it('등록한 일정이 1월 31일이면 다음달 2월 28일로 일정이 등록된다.', () => {
    const event: Event = {
      id: '2',
      title: 'test title',
      date: '2025-01-31',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'monthly', interval: 0 },
      notificationTime: 1,
    };
    const result = getRepeatingEvents(event);

    expect(result).toContainEqual({
      id: 'fixed-id',
      title: 'test title',
      date: '2025-02-28',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'monthly', interval: 0 },
      notificationTime: 1,
    });
  });

  it('등록한 일정이 매월 2025-09-30까지만 반복된다.', () => {
    const event: Event = {
      id: '2',
      title: 'test title',
      date: '2025-05-19',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'monthly', interval: 0, endDate: '2025-09-30' },
      notificationTime: 1,
    };
    const result = getRepeatingEvents(event);

    expect(result).not.toContainEqual({
      id: 'fixed-id',
      title: 'test title',
      date: '2025-10-19',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'monthly', interval: 0, endDate: '2025-09-30' },
      notificationTime: 1,
    });
  });
});

describe('매년 반복', () => {
  it('등록한 일정이 매년 반복된다.', () => {
    const event: Event = {
      id: '2',
      title: 'test title',
      date: '2025-05-19',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'yearly', interval: 0 },
      notificationTime: 1,
    };
    const result = getRepeatingEvents(event);

    expect(result).toContainEqual({
      id: 'fixed-id',
      title: 'test title',
      date: '2026-05-19',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'yearly', interval: 0 },
      notificationTime: 1,
    });
  });

  it('등록한 일정이 2년 주기로 반복된다.', () => {
    const event: Event = {
      id: '2',
      title: 'test title',
      date: '2025-05-19',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'yearly', interval: 2 },
      notificationTime: 1,
    };
    const result = getRepeatingEvents(event);

    expect(result).not.toContainEqual({
      id: 'fixed-id',
      title: 'test title',
      date: '2026-05-19',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'yearly', interval: 2 },
      notificationTime: 1,
    });
  });
  // 아이폰 캘린더 기준 윤달이면 해당 월의 말일로 설정
  it('등록한 일정이 윤년 29일이면 윤년이 아닌 월은 말일에 등록된다', () => {
    const event: Event = {
      id: '2',
      title: 'test title',
      date: '2028-02-29',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'yearly', interval: 0 },
      notificationTime: 1,
    };
    const result = getRepeatingEvents(event);

    expect(result).toContainEqual({
      id: 'fixed-id',
      title: 'test title',
      date: '2029-02-28',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'yearly', interval: 0 },
      notificationTime: 1,
    });

    expect(result).not.toContainEqual({
      id: '2',
      title: 'test title',
      date: '2030-03-01',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'yearly', interval: 0 },
      notificationTime: 1,
    });
  });

  it('등록한 일정이 2030년까지 반복된다.', () => {
    const event: Event = {
      id: '2',
      title: 'test title',
      date: '2025-05-19',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'yearly', interval: 0, endDate: '2030-06-01' },
      notificationTime: 1,
    };
    const result = getRepeatingEvents(event);
    expect(result.length).toBe(6);
    expect(result).not.toContainEqual({
      id: 'fixed-id',
      title: 'test title',
      date: '2031-05-19',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'yearly', interval: 0, endDate: '2030-06-01' },
      notificationTime: 1,
    });
  });
});
