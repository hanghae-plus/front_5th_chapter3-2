import { Event } from '../../types';
import { generateRepeatEvents } from '../../utils/eventUtils';

describe('generateRepeatEvents', () => {
  it('monthly 반복 이벤트를 생성한다', () => {
    const newEvent = {
      id: '1',
      title: '이벤트 1',
      date: '2025-07-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '이벤트 1 설명',
      location: '이벤트 1 위치',
      category: '이벤트 1 카테고리',
      repeat: { type: 'monthly', interval: 1 },
      notificationTime: 10,
    };
    const repeatEvents = generateRepeatEvents(newEvent as Event);

    expect(repeatEvents).toHaveLength(3);
    expect(repeatEvents[0].date).toBe('2025-07-01');
    expect(repeatEvents[1].date).toBe('2025-08-01');
    expect(repeatEvents[2].date).toBe('2025-09-01');
  });

  it('yearly 반복 설정하고 윤년 2월 29일로 지정한다', () => {
    const newEvent = {
      id: '1',
      title: '이벤트 1',
      date: '2024-02-29',
      startTime: '09:00',
      endTime: '10:00',
      description: '이벤트 1 설명',
      location: '이벤트 1 위치',
      category: '이벤트 1 카테고리',
      repeat: { type: 'yearly', interval: 1 },
      notificationTime: 10,
    };
    const repeatEvents = generateRepeatEvents(newEvent as Event);

    expect(repeatEvents).toHaveLength(2);
    expect(repeatEvents[0].date).toBe('2024-02-29');
    expect(repeatEvents[1].date).toBe('2025-02-28');
  });

  it('endDate가 지정되어 있으면 해당 날짜까지만 반복한다', () => {
    const newEvent = {
      id: '1',
      title: '이벤트 1',
      date: '2025-07-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '이벤트 1 설명',
      location: '이벤트 1 위치',
      category: '이벤트 1 카테고리',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-12-31' },
      notificationTime: 10,
    };
    const repeatEvents = generateRepeatEvents(newEvent as Event);

    expect(repeatEvents).toHaveLength(6);
    expect(repeatEvents[0].date).toBe('2025-07-01');
    expect(repeatEvents[1].date).toBe('2025-08-01');
    expect(repeatEvents[2].date).toBe('2025-09-01');
    expect(repeatEvents[3].date).toBe('2025-10-01');
    expect(repeatEvents[4].date).toBe('2025-11-01');
    expect(repeatEvents[5].date).toBe('2025-12-01');
  });

  it('monthly 반복 설정을 하고 7월 31일에 이벤트를 생성한다', () => {
    const newEvent = {
      id: '1',
      title: '이벤트 1',
      date: '2025-07-31',
      startTime: '09:00',
      endTime: '10:00',
      description: '이벤트 1 설명',
      location: '이벤트 1 위치',
      category: '이벤트 1 카테고리',
      repeat: { type: 'monthly', interval: 1 },
      notificationTime: 10,
    };
    const repeatEvents = generateRepeatEvents(newEvent as Event);

    expect(repeatEvents).toHaveLength(3);
    expect(repeatEvents[0].date).toBe('2025-07-31');
    expect(repeatEvents[1].date).toBe('2025-08-31');
    expect(repeatEvents[2].date).toBe('2025-09-30');
  });
});
