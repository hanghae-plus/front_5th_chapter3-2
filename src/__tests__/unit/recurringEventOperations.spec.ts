import { vi } from 'vitest';

import { Event } from '../../types';
  import {
    saveRecurringEvents,
    updateRecurringEvents,
    deleteRecurringEvents,
  } from '../../utils/recurringEventOperations';

global.fetch = vi.fn();

describe('반복 일정 작업 유틸리티 테스트', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const baseEvent: Omit<Event, 'id'> = {
    title: '반복 회의',
    date: '2025-10-01',
    startTime: '10:00',
    endTime: '11:00',
    description: '팀 주간 회의',
    location: '회의실 A',
    category: '업무',
    repeat: {
      type: 'weekly',
      interval: 1,
      endDate: '2025-10-15',
    },
    notificationTime: 10,
  };

  // Mock recurring events
  const mockRecurringEvents: Event[] = [
    {
      id: '1',
      ...baseEvent,
      date: '2025-10-01',
      repeat: {
        type: 'weekly',
        interval: 1,
        endDate: '2025-10-15',
      },
    },
    {
      id: '2',
      ...baseEvent,
      date: '2025-10-08',
      repeat: {
        type: 'weekly',
        interval: 1,
        endDate: '2025-10-15',
      },
    },
    {
      id: '3',
      ...baseEvent,
      date: '2025-10-15',
      repeat: {
        type: 'weekly',
        interval: 1,
        endDate: '2025-10-15',
      },
    },
  ];

  it('반복 일정 저장 함수가 구현되지 않았다 (실패 테스트)', async () => {
    expect(() => saveRecurringEvents(baseEvent)).toThrow();
  });

  // 실패 테스트: 반복 일정 수정
  it('반복 일정 수정 함수가 구현되지 않았다 (실패 테스트)', async () => {
    // 함수가 정의되지 않았을 경우
    expect(() => updateRecurringEvents('repeat-1', { title: '수정된 회의' })).toThrow();
  });

  // 실패 테스트: 반복 일정 삭제
  it('반복 일정 삭제 함수가 구현되지 않았다 (실패 테스트)', async () => {
    // 함수가 정의되지 않았을 경우
    expect(() => deleteRecurringEvents('repeat-1')).toThrow();
  });

  // 성공 테스트: 반복 일정 저장
  it('반복 일정을 성공적으로 저장한다', async () => {
    // Mock successful response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecurringEvents,
    });

    const result = await saveRecurringEvents(baseEvent);

    // API를 호출했는지 확인
    expect(global.fetch).toHaveBeenCalledWith('/api/events-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    });

    // 결과가 올바른지 확인
    expect(result).toEqual(mockRecurringEvents);
  });

  // 성공 테스트: 반복 일정 수정
  it('반복 일정을 성공적으로 수정한다', async () => {
    // Mock successful response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecurringEvents,
    });

    const result = await updateRecurringEvents('repeat-1', { title: '수정된 회의' });

    // API를 호출했는지 확인
    expect(global.fetch).toHaveBeenCalledWith('/api/events-list', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    });

    // 결과가 올바른지 확인
    expect(result).toEqual(mockRecurringEvents);
  });

  // 성공 테스트: 반복 일정 삭제
  it('반복 일정을 성공적으로 삭제한다', async () => {
    // Mock successful response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    await deleteRecurringEvents('repeat-1');

    // API를 호출했는지 확인
    expect(global.fetch).toHaveBeenCalledWith('/api/events-list', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    });
  });

  // 성공 테스트: 일정 단일 수정
  it('반복 일정의 단일 인스턴스를 성공적으로 수정한다', async () => {
    const event = mockRecurringEvents[0];

    // Mock successful response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...event,
        title: '수정된 회의',
        repeat: { type: 'none', interval: 0 }, // 반복 속성이 제거됨
      }),
    });

    // 단일 이벤트 업데이트 함수 호출 (이 함수는 구현해야 함)
    const updateSingleEvent = async (event: Event, updates: Partial<Event>) => {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...event, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      return response.json();
    };

    const result = await updateSingleEvent(event, {
      title: '수정된 회의',
      repeat: { type: 'none', interval: 0 }, // 반복 속성 제거
    });

    // API를 호출했는지 확인
    expect(global.fetch).toHaveBeenCalledWith('/api/events/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    });

    // 결과가 올바른지 확인 - 반복 속성이 제거되어야 함
    expect(result.repeat.type).toBe('none');
  });

  // 성공 테스트: 일정 단일 삭제
  it('반복 일정의 단일 인스턴스를 성공적으로 삭제한다', async () => {
    const event = mockRecurringEvents[0];

    // Mock successful response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    // 단일 이벤트 삭제 함수 호출 (이 함수는 구현해야 함)
    const deleteSingleEvent = async (eventId: string) => {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      return true;
    };

    await deleteSingleEvent(event.id);

    // API를 호출했는지 확인
    expect(global.fetch).toHaveBeenCalledWith('/api/events/1', {
      method: 'DELETE',
    });
  });
});
