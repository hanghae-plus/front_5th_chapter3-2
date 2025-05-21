import { randomUUID } from 'crypto';

import { act, renderHook } from '@testing-library/react';

import { setupMockHandlerList } from '@/__mocks__/handlersUtils.ts';
import { useEventOperations } from '@/hooks/useEventOperations.ts';
import { Event } from '@/types.ts';
import { createRepeatEvents } from '@/utils/eventUtils';

const toastFn = vi.fn();

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => toastFn,
  };
});

it('반복 일정이 포함된 경우 일정의 경우 동일한 반복 일정 ID를 갖는 일정 배열로 반환된다.', async () => {
  setupMockHandlerList();

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  const newEvent: Event = {
    id: '1',
    title: '새 회의',
    date: '2025-10-16',
    startTime: '11:00',
    endTime: '12:00',
    description: '새로운 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { id: randomUUID(), type: 'daily', interval: 3, endDate: '2025-10-31' },
    notificationTime: 5,
  };

  await act(async () => {
    await result.current.saveRepeatEvent(newEvent);
  });

  expect(result.current.events.length).toBe(6);

  const repeatId = result.current.events[0].repeat.id;
  expect(result.current.events.every(({ repeat: { id } }) => id === repeatId)).toBe(true);
});

// 5. 반복 일정 단일 수정 - 반복 일정을 수정하면 단일 일정으로 변경된다.
it('반복 일정을 수정하면 해당 이벤트만 단일로 수정되고, 반복 정보가 제거된다.', async () => {
  const events = createRepeatEvents({
    id: '1',
    title: '새 회의',
    date: '2025-10-16',
    startTime: '11:00',
    endTime: '12:00',
    description: '새로운 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { id: '', type: 'daily', interval: 3, endDate: '2025-10-31' },
    notificationTime: 5,
  }) as Event[];

  events.forEach((_, index) => {
    events[index].id = randomUUID();
  });

  setupMockHandlerList(events as Event[]);

  const { result } = renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  expect(result.current.events.length).toBe(6);
  const repeatId = result.current.events[0].repeat.id;
  expect(result.current.events.every(({ repeat: { id } }) => id === repeatId)).toBe(true);

  await act(async () => {
    await result.current.saveRepeatEvent({ ...events[0], title: '수정된 회의' });
  });

  // 반복 일정은 5개로 줄어듬
  const repeatEvents = result.current.events.filter(({ repeat }) => repeat.type !== 'none');
  expect(repeatEvents.length).toBe(5);

  // 변경한 대상은 반복 이벤트가 아니게 됨
  const targetEvent = result.current.events.find(({ id }) => id === events[0].id);
  expect(targetEvent?.repeat).toEqual({ interval: 0, type: 'none' });
});

// 6. 반복 일정 단일 삭제 - 반복 일정을 삭제하면 해당 일정만 삭제된다.
it('반복 일정을 제거하면 해당 이벤트만 단일로 제거된다.', async () => {
  const events = createRepeatEvents({
    id: '1',
    title: '새 회의',
    date: '2025-10-16',
    startTime: '11:00',
    endTime: '12:00',
    description: '새로운 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { id: '', type: 'daily', interval: 3, endDate: '2025-10-31' },
    notificationTime: 5,
  }) as Event[];

  events.forEach((_, index) => {
    events[index].id = randomUUID();
  });

  setupMockHandlerList(events as Event[]);

  const { result } = renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  expect(result.current.events.length).toBe(6);
  const repeatId = result.current.events[0].repeat.id;
  expect(result.current.events.every(({ repeat: { id } }) => id === repeatId)).toBe(true);

  await act(async () => {
    await result.current.deleteEvent(events[0].id);
  });

  // 반복 일정은 5개로 줄어듬
  const repeatEvents = result.current.events.filter(({ repeat }) => repeat.type !== 'none');
  expect(repeatEvents.length).toBe(5);

  // 삭제한 대상은 찾을 수 없음
  const targetEvent = result.current.events.findIndex(({ id }) => id === events[0].id);
  expect(targetEvent).toBe(-1);
});
