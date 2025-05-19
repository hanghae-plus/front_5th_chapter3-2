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
      id: '2',
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
      id: '2',
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
      id: '2',
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
      id: '2',
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
      id: '2',
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

  it('등록한 일정이 윤년 29일이면 다음 윤년 29일에 반복된다.', () => {
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
      id: '2',
      title: 'test title',
      date: '2032-02-29',
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
      date: '2031-02-28',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'yearly', interval: 0 },
      notificationTime: 1,
    });
  });
});
