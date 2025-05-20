import { EventForm } from '../../types';
import { createRepeatEvents } from '../../utils/createRepeatEvents';

describe('createRepeatEvents', () => {
  it('반복 설정이 없는 경우 하나의 이벤트가 있는 배열을 반환한다.', () => {
    const event: EventForm = {
      title: '새 회의',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 5,
    };
    const result = createRepeatEvents(event);
    expect(result).toEqual([event]);
  });

  it('월말 처리: 월말 기준으로 등록할 경우 해당 월의 마지막 날을 반환한다.', () => {
    const event: EventForm = {
      title: '새 회의',
      date: '2025-01-31',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-04-30' },
      notificationTime: 5,
    };
    const result = createRepeatEvents(event);
    expect(result).toEqual([
      {
        title: '새 회의',
        date: '2025-01-31',
        startTime: '11:00',
        endTime: '12:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-04-30' },
        notificationTime: 5,
      },
      {
        title: '새 회의',
        date: '2025-02-28',
        startTime: '11:00',
        endTime: '12:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-04-30' },
        notificationTime: 5,
      },
      {
        title: '새 회의',
        date: '2025-03-31',
        startTime: '11:00',
        endTime: '12:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-04-30' },
        notificationTime: 5,
      },
      {
        title: '새 회의',
        date: '2025-04-30',
        startTime: '11:00',
        endTime: '12:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-04-30' },
        notificationTime: 5,
      },
    ]);
  });
});
