import { act, renderHook } from '@testing-library/react';

import { useEventForm } from '../../hooks/useEventForm';
import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { Event } from '../../types.ts';

describe('반복 일정 수정', () => {
  it('반복 일정 중 하나를 수정하면 반복 아이콘이 사라지며 단일 일정으로 변경된다.', async () => {
    const singleEvent: Event = {
      id: 'single-event',
      title: '단일 이벤트',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '12:00',
      description: '이것은 단일 이벤트.',
      location: '회사',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };

    const repeatedEventBase: Omit<Event, 'id' | 'date'> = {
      title: '테스트',
      startTime: '14:00',
      endTime: '15:00',
      description: '설명',
      location: '위치',
      category: '개인',
      repeat: {
        type: 'weekly',
        interval: 1,
        endDate: '2025-08-20',
        id: 'repeat-id',
      },
      notificationTime: 15,
    };

    const initialRepeatedEvents: Event[] = [
      { ...repeatedEventBase, id: '1', date: '2025-08-01' },
      { ...repeatedEventBase, id: '2', date: '2025-08-08' },
      { ...repeatedEventBase, id: '3', date: '2025-08-15' },
    ];

    let mockEvents: Event[] = [singleEvent, ...initialRepeatedEvents];

    const targetEvent = mockEvents.find((event) => event.id === '1');

    const { result } = renderHook(() => useEventForm());
    const { result: result2 } = renderHook(() => useEventOperations(true));

    const updatedEvent = {
      ...targetEvent,
      title: '단일 일정이 되어버린 테스트',
      description: '단일 일정이 되어버린 테스트 설명',
      repeat: { type: 'none', interval: 0 },
    };

    act(() => {
      result.current.editEvent(updatedEvent as Event);
      result2.current.saveEvent(updatedEvent as Event);
    });

    expect(result.current.title).toBe('단일 일정이 되어버린 테스트');
    expect(result.current.description).toBe('단일 일정이 되어버린 테스트 설명');
    expect(result.current.isRepeating).toBe(false);
    expect(result.current.repeatType).toBe('none');
  });
});
