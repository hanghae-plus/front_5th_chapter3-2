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

  // 1. 반복 유형 선택 - 일정 생성 또는 수정 시 반복 유형을 선택할 수 있다.
  // 2. 반복 간격 설정 - 각 반복 유형에 대해 간격을 설정할 수 있다.
  // 4. 반복 종료 조건을 지정할 수 있다.
  describe('반복 이벤트에 따라 이벤트 배열을 반환한다.', () => {
    it('2일 마다 종료일 까지 반복되는 이벤트 배열을 반환한다.', () => {
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
    it('3주 마다 종료일까지 반복되는 이벤트 배열을 반환한다.', () => {
      const events = createRepeatEvents({
        ...common,
        repeat: { type: 'weekly', interval: 3, endDate: '2025-06-30' },
      });
      expect(events.length).toBe(3);
      expect(events[0].date).toBe('2025-05-10');
      expect(events[1].date).toBe('2025-05-31');
      expect(events[2].date).toBe('2025-06-21');
    });
    it('2개월 마다 종료일이 없는 이벤트 배열을 반환한다. (예제 조건에 따라 무한정 생산하지 않는다.)', () => {
      // 예제에는 2025-09-30 으로 제한중이지만, 연마다 반복을 위해 2026-06-30로 설정
      const events = createRepeatEvents({
        ...common,
        repeat: { type: 'monthly', interval: 2, endDate: '' },
      });
      expect(events.length).toBe(7);
      expect(events[0].date).toBe('2025-05-10');
      expect(events[1].date).toBe('2025-07-10');
      expect(events[2].date).toBe('2025-09-10');
      expect(events[3].date).toBe('2025-11-10');
      expect(events[4].date).toBe('2026-01-10');
      expect(events[5].date).toBe('2026-03-10');
      expect(events[6].date).toBe('2026-05-10');
    });

    it('1년 마다 종료일까지 반복되는 이벤트 배열을 반환한다.', () => {
      const events = createRepeatEvents({
        ...common,
        repeat: { type: 'yearly', interval: 1, endDate: '2027-06-30' },
      });
      expect(events.length).toBe(3);
      expect(events[0].date).toBe('2025-05-10');
      expect(events[1].date).toBe('2026-05-10');
      expect(events[2].date).toBe('2027-05-10');
    });
  });
});
