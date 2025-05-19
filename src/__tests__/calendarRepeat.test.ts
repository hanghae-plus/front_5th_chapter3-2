import { Event } from '../types';
import { getRepeatingEvents } from '../utils/getRepeatingEvents';

describe('getRepeatingEvents', () => {
  it('등록한 일정이 매일 반복된다.', async () => {
    const event: Event = {
      id: '2',
      title: 'test title',
      date: '2025-05-19',
      startTime: '10:00',
      endTime: '11:00',
      description: 'test description',
      location: 'test home',
      category: '업무',
      repeat: { type: 'daily', interval: 10 },
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
      repeat: { type: 'daily', interval: 10 },
      notificationTime: 1,
    });
  });
});
