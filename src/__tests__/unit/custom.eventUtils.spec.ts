import { Event } from '@/types';
import { createRepeatEvents } from '@/utils/eventUtils';

describe('createRepeatEvents', () => {
  const common: Event = {
    id: '1',
    title: '반복 일정 1',
    date: '2025-05-10',
    startTime: '10:00',
    endTime: '11:00',
    description: '반복 일정 1 설명',
    location: '집',
    category: '개인',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 0,
  };
  describe('반복 이벤트에 따라 이벤트 배열을 반환한다.', () => {
    it('2일 마다 반복하는 이벤트 배열을 반환한다.', () => {
      const events = createRepeatEvents({
        ...common,
        repeat: { type: 'daily', interval: 2, endDate: '2025-05-14' },
      });
      expect(events).toEqual([
        {
          category: '개인',
          date: '2025-05-10',
          description: '반복 일정 1 설명',
          endTime: '11:00',
          id: '1',
          location: '집',
          notificationTime: 0,
          repeat: { endDate: '2025-05-14', interval: 2, type: 'daily' },
          startTime: '10:00',
          title: '반복 일정 1',
        },
        {
          category: '개인',
          date: '2025-05-12',
          description: '반복 일정 1 설명',
          endTime: '11:00',
          id: '1',
          location: '집',
          notificationTime: 0,
          repeat: { endDate: '2025-05-14', interval: 2, type: 'daily' },
          startTime: '10:00',
          title: '반복 일정 1',
        },
        {
          category: '개인',
          date: '2025-05-14',
          description: '반복 일정 1 설명',
          endTime: '11:00',
          id: '1',
          location: '집',
          notificationTime: 0,
          repeat: {
            endDate: '2025-05-14',
            interval: 2,
            type: 'daily',
          },
          startTime: '10:00',
          title: '반복 일정 1',
        },
      ]);
    });
  });
});
