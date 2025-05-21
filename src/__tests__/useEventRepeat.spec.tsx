import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useEventRepeat } from '../hooks/useEventRepeat';
import { Event, RepeatInfo } from '../types';

describe('useEventRepeat 훅 테스트', () => {
  let mockInitialEvent: Event;

  beforeEach(() => {
    mockInitialEvent = {
      id: 'event_1',
      title: '테스트 일정',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
        endType: 'count',
        endCount: 1,
      },
      notificationTime: 30,
    };
  });

  test('반복 일정을 생성한다', async () => {
    const { result } = renderHook(() => useEventRepeat({ initialEvent: mockInitialEvent }));

    const repeatInfo: RepeatInfo = {
      type: 'daily',
      interval: 1,
      endType: 'count',
      endCount: 3,
    };

    await act(async () => {
      result.current.generateRepeatEvents(repeatInfo);
    });

    expect(result.current.events).toHaveLength(3);
    expect(result.current.events[0].date).toBe('2025-10-01');
    expect(result.current.events[1].date).toBe('2025-10-02');
    expect(result.current.events[2].date).toBe('2025-10-03');
  });

  test('반복 일정을 수정한다', async () => {
    const { result } = renderHook(() => useEventRepeat({ initialEvent: mockInitialEvent }));

    const repeatInfo: RepeatInfo = {
      type: 'daily',
      interval: 1,
      endType: 'count',
      endCount: 2,
    };

    await act(async () => {
      result.current.generateRepeatEvents(repeatInfo);
    });

    await act(async () => {
      result.current.updateRepeatEvent('event_1_1', { title: '수정된 일정' });
    });

    expect(result.current.events[1].title).toBe('수정된 일정');
    expect(result.current.events[0].title).toBe('테스트 일정');
  });

  test('반복 일정을 삭제한다', async () => {
    const { result } = renderHook(() => useEventRepeat({ initialEvent: mockInitialEvent }));

    const repeatInfo: RepeatInfo = {
      type: 'daily',
      interval: 1,
      endType: 'count',
      endCount: 2,
    };

    await act(async () => {
      result.current.generateRepeatEvents(repeatInfo);
    });

    await act(async () => {
      result.current.deleteRepeatEvent('event_1_1');
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].id).toBe('event_1');
  });

  test('모든 반복 일정을 수정한다', async () => {
    const { result } = renderHook(() => useEventRepeat({ initialEvent: mockInitialEvent }));

    const repeatInfo: RepeatInfo = {
      type: 'daily',
      interval: 1,
      endType: 'count',
      endCount: 2,
    };

    await act(async () => {
      result.current.generateRepeatEvents(repeatInfo);
    });

    await act(async () => {
      result.current.updateAllRepeatEvents({ title: '전체 수정된 일정' });
    });

    expect(result.current.events[0].title).toBe('전체 수정된 일정');
    expect(result.current.events[1].title).toBe('전체 수정된 일정');
  });

  test('모든 반복 일정을 삭제한다', async () => {
    const { result } = renderHook(() => useEventRepeat({ initialEvent: mockInitialEvent }));

    const repeatInfo: RepeatInfo = {
      type: 'daily',
      interval: 1,
      endType: 'count',
      endCount: 2,
    };

    await act(async () => {
      result.current.generateRepeatEvents(repeatInfo);
    });

    await act(async () => {
      result.current.deleteAllRepeatEvents();
    });

    expect(result.current.events).toHaveLength(0);
  });

  test('주간 반복에서 특정 요일만 선택한다', async () => {
    const { result } = renderHook(() => useEventRepeat({ initialEvent: mockInitialEvent }));

    const repeatInfo: RepeatInfo = {
      type: 'weekly',
      interval: 1,
      endType: 'count',
      endCount: 2,
      daysOfWeek: [3], // 수요일 (2025-10-01은 수요일)
    };

    await act(async () => {
      result.current.generateRepeatEvents(repeatInfo);
    });

    expect(result.current.events[0].date).toBe('2025-10-01');
    expect(result.current.events[1].date).toBe('2025-10-08');
  });

  test('반복 일정 생성 시 콜백이 호출된다', async () => {
    const onRepeatChange = vi.fn();
    const { result } = renderHook(() =>
      useEventRepeat({
        initialEvent: mockInitialEvent,
        onRepeatChange,
      })
    );

    const repeatInfo: RepeatInfo = {
      type: 'daily',
      interval: 1,
      endType: 'count',
      endCount: 2,
    };

    await act(async () => {
      result.current.generateRepeatEvents(repeatInfo);
    });

    expect(onRepeatChange).toHaveBeenCalledWith(result.current.events);
  });
});
