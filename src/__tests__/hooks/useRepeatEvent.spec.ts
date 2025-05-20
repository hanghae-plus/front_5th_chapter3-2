import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { useRepeatEvent } from '../../hooks/useRepeatEvent';
import { EventForm } from '../../types';

describe('useRepeatEvent', () => {
  it('반복 일정을 생성할 수 있다', () => {
    const { result } = renderHook(() => useRepeatEvent());

    const newEvent: EventForm = {
      title: '테스트 일정',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '테스트 장소',
      category: '테스트 카테고리',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-10-03',
      },
      notificationTime: 30,
    };

    act(() => {
      result.current.createRepeatEvent(newEvent);
    });

    expect(result.current.events).toHaveLength(3);
    expect(result.current.events[0].date).toBe('2025-10-01');
    expect(result.current.events[1].date).toBe('2025-10-02');
    expect(result.current.events[2].date).toBe('2025-10-03');
  });

  it('반복 일정을 수정할 수 있다', () => {
    const { result } = renderHook(() => useRepeatEvent());

    const newEvent: EventForm = {
      title: '테스트 일정',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '테스트 장소',
      category: '테스트 카테고리',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-10-03',
      },
      notificationTime: 30,
    };

    act(() => {
      result.current.createRepeatEvent(newEvent);
    });

    const updatedEvent = {
      ...result.current.events[1],
      title: '수정된 일정',
    };

    act(() => {
      result.current.updateRepeatEvent(updatedEvent);
    });

    expect(result.current.events[1].title).toBe('수정된 일정');
    expect(result.current.events[0].title).toBe('테스트 일정');
    expect(result.current.events[2].title).toBe('테스트 일정');
  });

  it('반복 일정을 삭제할 수 있다', () => {
    const { result } = renderHook(() => useRepeatEvent());

    const newEvent: EventForm = {
      title: '테스트 일정',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '테스트 장소',
      category: '테스트 카테고리',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-10-03',
      },
      notificationTime: 30,
    };

    act(() => {
      result.current.createRepeatEvent(newEvent);
    });

    act(() => {
      result.current.deleteRepeatEvent(result.current.events[1].id);
    });

    expect(result.current.events).toHaveLength(2);
    expect(result.current.events[0].date).toBe('2025-10-01');
    expect(result.current.events[1].date).toBe('2025-10-03');
  });
});
