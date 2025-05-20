import { describe, it, expect } from 'vitest';

import { createRepeatEvents } from '../../utils/repeatEvent';

describe('반복 일정 생성', () => {
  it('매일 반복 일정을 생성할 수 있다', () => {
    const baseEvent = {
      title: '테스트 일정',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '테스트 장소',
      category: '테스트 카테고리',
      repeat: {
        type: 'daily' as const,
        interval: 1,
        endDate: '2025-10-05',
      },
      notificationTime: 30,
    };

    const events = createRepeatEvents(baseEvent);

    expect(events).toHaveLength(5); // 10-01부터 10-05까지 5개의 일정
    expect(events[0].date).toBe('2025-10-01');
    expect(events[1].date).toBe('2025-10-02');
    expect(events[2].date).toBe('2025-10-03');
    expect(events[3].date).toBe('2025-10-04');
    expect(events[4].date).toBe('2025-10-05');
  });

  it('반복 일정 생성 함수가 존재해야 한다', () => {
    // 아직 구현되지 않은 함수를 호출
    expect(createRepeatEvents).toBeDefined();
  });

  describe('반복 유형 선택', () => {
    it('반복 유형이 none인 경우 단일 일정만 생성된다', () => {
      const baseEvent = {
        title: '테스트 일정',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '테스트 설명',
        location: '테스트 장소',
        category: '테스트 카테고리',
        repeat: {
          type: 'none' as const,
          interval: 1,
        },
        notificationTime: 30,
      };

      const events = createRepeatEvents(baseEvent);

      expect(events).toHaveLength(1);
      expect(events[0].date).toBe('2025-10-01');
    });

    it('반복 유형이 daily인 경우 매일 반복되는 일정이 생성된다', () => {
      const baseEvent = {
        title: '테스트 일정',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '테스트 설명',
        location: '테스트 장소',
        category: '테스트 카테고리',
        repeat: {
          type: 'daily' as const,
          interval: 1,
          endDate: '2025-10-03',
        },
        notificationTime: 30,
      };

      const events = createRepeatEvents(baseEvent);

      expect(events).toHaveLength(3);
      expect(events[0].date).toBe('2025-10-01');
      expect(events[1].date).toBe('2025-10-02');
      expect(events[2].date).toBe('2025-10-03');
    });

    it('반복 유형이 weekly인 경우 매주 반복되는 일정이 생성된다', () => {
      const baseEvent = {
        title: '테스트 일정',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '테스트 설명',
        location: '테스트 장소',
        category: '테스트 카테고리',
        repeat: {
          type: 'weekly' as const,
          interval: 1,
          endDate: '2025-10-15',
        },
        notificationTime: 30,
      };

      const events = createRepeatEvents(baseEvent);

      expect(events).toHaveLength(3);
      expect(events[0].date).toBe('2025-10-01');
      expect(events[1].date).toBe('2025-10-08');
      expect(events[2].date).toBe('2025-10-15');
    });

    it('반복 유형이 monthly인 경우 매월 반복되는 일정이 생성된다', () => {
      const baseEvent = {
        title: '테스트 일정',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '테스트 설명',
        location: '테스트 장소',
        category: '테스트 카테고리',
        repeat: {
          type: 'monthly' as const,
          interval: 1,
          endDate: '2025-12-01',
        },
        notificationTime: 30,
      };

      const events = createRepeatEvents(baseEvent);

      expect(events).toHaveLength(3);
      expect(events[0].date).toBe('2025-10-01');
      expect(events[1].date).toBe('2025-11-01');
      expect(events[2].date).toBe('2025-12-01');
    });

    it('반복 유형이 yearly인 경우 매년 반복되는 일정이 생성된다', () => {
      const baseEvent = {
        title: '테스트 일정',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '테스트 설명',
        location: '테스트 장소',
        category: '테스트 카테고리',
        repeat: {
          type: 'yearly' as const,
          interval: 1,
          endDate: '2027-10-01',
        },
        notificationTime: 30,
      };

      const events = createRepeatEvents(baseEvent);

      expect(events).toHaveLength(3);
      expect(events[0].date).toBe('2025-10-01');
      expect(events[1].date).toBe('2026-10-01');
      expect(events[2].date).toBe('2027-10-01');
    });
  });
});
