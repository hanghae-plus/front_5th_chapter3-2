import { EventForm, RepeatType } from '../../types';
import { generateRepeatEvents } from '../../utils/eventUtils';

describe('generateRepeatEvents', () => {
  const baseEvent: Omit<EventForm, 'repeat'> = {
    title: '테스트 이벤트',
    description: '테스트 설명',
    date: '2025-10-15',
    startTime: '09:00',
    endTime: '10:00',
    location: '회의실 A',
    category: '업무',
    notificationTime: 10,
  };

  describe('일간 반복 (Daily)', () => {
    it('매일 반복되는 이벤트를 생성한다', () => {
      const repeat = {
        type: 'daily' as RepeatType,
        interval: 1,
        endDate: '2025-10-18',
      };

      const events = generateRepeatEvents(baseEvent, repeat);

      expect(events).toHaveLength(4);

      events.forEach((event, index) => {
        const expectedDate = new Date('2025-10-15');

        expectedDate.setDate(expectedDate.getDate() + index);

        expect(event.date).toBe(expectedDate.toISOString().split('T')[0]);
        expect(event.repeat).toEqual({
          type: 'daily',
          interval: 1,
          count: undefined,
        });
      });
    });

    it('2일 간격으로 반복되는 이벤트를 생성한다', () => {
      const repeat = {
        type: 'daily' as RepeatType,
        interval: 2,
        endDate: '2025-10-21',
      };

      const events = generateRepeatEvents(baseEvent, repeat);

      expect(events).toHaveLength(4);

      events.forEach((event, index) => {
        const expectedDate = new Date('2025-10-15');

        expectedDate.setDate(expectedDate.getDate() + index * 2);

        expect(event.date).toBe(expectedDate.toISOString().split('T')[0]);
      });
    });
  });

  describe('주간 반복 (Weekly)', () => {
    it('매주 반복되는 이벤트를 생성한다', () => {
      const repeat = {
        type: 'weekly' as RepeatType,
        interval: 1,
        endDate: '2025-11-05',
      };

      const events = generateRepeatEvents(baseEvent, repeat);

      expect(events).toHaveLength(4);

      events.forEach((event, index) => {
        const expectedDate = new Date('2025-10-15');

        expectedDate.setDate(expectedDate.getDate() + index * 7);

        expect(event.date).toBe(expectedDate.toISOString().split('T')[0]);
        expect(event.repeat).toEqual({
          type: 'weekly',
          interval: 1,
          count: undefined,
        });
      });
    });

    it('2주 간격으로 반복되는 이벤트를 생성한다', () => {
      const repeat = {
        type: 'weekly' as RepeatType,
        interval: 2,
        endDate: '2025-11-26',
      };

      const events = generateRepeatEvents(baseEvent, repeat);

      expect(events).toHaveLength(4);

      events.forEach((event, index) => {
        const expectedDate = new Date('2025-10-15');

        expectedDate.setDate(expectedDate.getDate() + index * 14);

        expect(event.date).toBe(expectedDate.toISOString().split('T')[0]);
      });
    });
  });

  describe('월간 반복 (Monthly)', () => {
    it('매월 반복되는 이벤트를 생성한다', () => {
      const repeat = {
        type: 'monthly' as RepeatType,
        interval: 1,
        endDate: '2026-01-15',
      };

      const events = generateRepeatEvents(baseEvent, repeat);

      expect(events).toHaveLength(4);

      events.forEach((event, index) => {
        const expectedDate = new Date('2025-10-15');

        expectedDate.setMonth(expectedDate.getMonth() + index);

        expect(event.date).toBe(expectedDate.toISOString().split('T')[0]);
        expect(event.repeat).toEqual({
          type: 'monthly',
          interval: 1,
          count: undefined,
        });
      });
    });
  });

  describe('연간 반복 (Yearly)', () => {
    it('매년 반복되는 이벤트를 생성한다', () => {
      const repeat = {
        type: 'yearly' as RepeatType,
        interval: 1,
        endDate: '2028-10-15',
      };

      const events = generateRepeatEvents(baseEvent, repeat);

      expect(events).toHaveLength(4);

      events.forEach((event, index) => {
        const expectedDate = new Date('2025-10-15');

        expectedDate.setFullYear(expectedDate.getFullYear() + index);

        expect(event.date).toBe(expectedDate.toISOString().split('T')[0]);
        expect(event.repeat).toEqual({
          type: 'yearly',
          interval: 1,
          count: undefined,
        });
      });
    });
  });

  describe('반복 횟수 제한 (Count)', () => {
    it('지정된 횟수만큼만 이벤트를 생성한다', () => {
      const repeat = {
        type: 'daily' as RepeatType,
        interval: 1,
        endDate: '2025-10-30',
        count: 3,
      };

      const events = generateRepeatEvents(baseEvent, repeat);

      expect(events).toHaveLength(3);
      expect(events[0].date).toBe('2025-10-15');
      expect(events[1].date).toBe('2025-10-16');
      expect(events[2].date).toBe('2025-10-17');

      events.forEach((event) => {
        expect(event.repeat).toEqual({
          type: 'daily',
          interval: 1,
          count: 3,
        });
      });
    });

    it('종료일이 먼저 오면 종료일까지만 이벤트를 생성한다', () => {
      const repeat = {
        type: 'daily' as RepeatType,
        interval: 1,
        endDate: '2025-10-17',
        count: 10,
      };

      const events = generateRepeatEvents(baseEvent, repeat);

      expect(events).toHaveLength(3); // 종료일이 먼저 와서 3개만 생성
      expect(events[0].date).toBe('2025-10-15');
      expect(events[1].date).toBe('2025-10-16');
      expect(events[2].date).toBe('2025-10-17');
    });
  });

  describe('이벤트 속성 검증', () => {
    it('생성된 모든 이벤트가 기본 이벤트의 속성을 유지한다', () => {
      const repeat = {
        type: 'daily' as RepeatType,
        interval: 1,
        endDate: '2025-10-17',
      };

      const events = generateRepeatEvents(baseEvent, repeat);

      events.forEach((event) => {
        expect(event).toMatchObject({
          title: baseEvent.title,
          description: baseEvent.description,
          startTime: baseEvent.startTime,
          endTime: baseEvent.endTime,
          location: baseEvent.location,
          category: baseEvent.category,
          notificationTime: baseEvent.notificationTime,
        });
      });
    });
  });
});
