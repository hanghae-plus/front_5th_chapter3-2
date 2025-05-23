import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../../__mocks__/handlersUtils.ts';
import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { server } from '../../setupTests.ts';
import { Event, EventForm } from '../../types.ts';

const toastFn = vi.fn();

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => toastFn,
  };
});

beforeEach(() => {
  server.resetHandlers();
  toastFn.mockClear();
});

it('저장되어있는 초기 이벤트 데이터를 적절하게 불러온다', async () => {
  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({
        events: [
          {
            id: '1',
            title: '기존 회의',
            date: '2025-10-15',
            startTime: '09:00',
            endTime: '10:00',
            description: '기존 팀 미팅',
            location: '회의실 B',
            category: '업무',
            repeat: { type: 'none', interval: 0 },
            notificationTime: 10,
          } as Event,
        ],
      });
    })
  );
  const { result } = renderHook(() => useEventOperations(false));
  await act(() => Promise.resolve(null));
  expect(result.current.events).toEqual<Event[]>([
    {
      id: '1',
      title: '기존 회의',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
  ]);
  expect(toastFn).toHaveBeenCalledWith(expect.objectContaining({ title: '일정 로딩 완료!' }));
});

it('정의된 이벤트 정보를 기준으로 적절하게 저장이 된다', async () => {
  setupMockHandlerCreation();

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
    repeat: { type: 'none', interval: 0 },
    notificationTime: 5,
  };

  await act(async () => {
    await result.current.saveEvent(newEvent);
  });

  expect(result.current.events).toEqual<Event[]>([{ ...newEvent, id: '1' }]);
});

it("새로 정의된 'title', 'endTime' 기준으로 적절하게 일정이 업데이트 된다", async () => {
  setupMockHandlerUpdating();

  const { result } = renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  const updatedEvent: Event = {
    id: '1',
    date: '2025-10-15',
    startTime: '09:00',
    description: '기존 팀 미팅',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
    title: '수정된 회의',
    endTime: '11:00',
  };

  await act(async () => {
    await result.current.saveEvent(updatedEvent);
  });

  expect(result.current.events[0]).toEqual<Event>(updatedEvent);
});

it('존재하는 이벤트 삭제 시 에러없이 아이템이 삭제된다.', async () => {
  setupMockHandlerDeletion();

  const { result } = renderHook(() => useEventOperations(false));

  await act(async () => {
    await result.current.deleteEvent('1');
  });

  await act(() => Promise.resolve(null));

  expect(result.current.events).toEqual<Event[]>([]);
});

it("이벤트 로딩 실패 시 '이벤트 로딩 실패'라는 텍스트와 함께 에러 토스트가 표시되어야 한다", async () => {
  server.use(
    http.get('/api/events', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  expect(toastFn).toHaveBeenCalledWith({
    duration: 3000,
    isClosable: true,
    title: '이벤트 로딩 실패',
    status: 'error',
  });

  server.resetHandlers();
});

it("존재하지 않는 이벤트 수정 시 '일정 저장 실패'라는 토스트가 노출되며 에러 처리가 되어야 한다", async () => {
  const { result } = renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  const nonExistentEvent: Event = {
    id: '999',
    title: '존재하지 않는 이벤트',
    date: '2025-07-20',
    startTime: '09:00',
    endTime: '10:00',
    description: '이 이벤트는 존재하지 않습니다',
    location: '어딘가',
    category: '기타',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.saveEvent(nonExistentEvent);
  });

  expect(toastFn).toHaveBeenCalledWith({
    duration: 3000,
    isClosable: true,
    title: '일정 저장 실패',
    status: 'error',
  });
});

it("네트워크 오류 시 '일정 삭제 실패'라는 텍스트가 노출되며 이벤트 삭제가 실패해야 한다", async () => {
  server.use(
    http.delete('/api/events/:id', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  await act(async () => {
    await result.current.deleteEvent('1');
  });

  expect(toastFn).toHaveBeenCalledWith({
    duration: 3000,
    isClosable: true,
    title: '일정 삭제 실패',
    status: 'error',
  });

  expect(result.current.events).toHaveLength(1);
});

it('정의된 반복 일정 정보를 기준으로 적절하게 반복 저장이 된다', async () => {
  server.use(
    http.post('/api/events-list', async ({ request }) => {
      await request.json();
      return HttpResponse.json({ message: 'Events saved' }, { status: 201 });
    }),
    http.get('/api/events', () => {
      return HttpResponse.json({
        events: [
          {
            id: '1',
            title: '기존 회의',
            date: '2025-10-15',
            startTime: '09:00',
            endTime: '10:00',
            description: '기존 팀 미팅',
            location: '회의실 B',
            category: '업무',
            repeat: { type: 'none', interval: 0 },
            notificationTime: 10,
          },
          {
            id: '2',
            title: '주간 반복 회의',
            date: '2025-10-22',
            startTime: '10:00',
            endTime: '11:00',
            description: '주간 반복 팀 미팅',
            location: '회의실 C',
            category: '업무',
            repeat: { type: 'weekly', interval: 1, id: '1' },
            notificationTime: 10,
          },
          {
            id: '3',
            title: '주간 반복 회의',
            date: '2025-10-29',
            startTime: '10:00',
            endTime: '11:00',
            description: '주간 반복 팀 미팅',
            location: '회의실 C',
            category: '업무',
            repeat: { type: 'weekly', interval: 1, id: '1' },
            notificationTime: 10,
          },
        ],
      });
    })
  );

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  const newRepeatedEventData: EventForm = {
    title: '주간 반복 회의',
    date: '2025-10-15',
    startTime: '10:00',
    endTime: '11:00',
    description: '주간 반복 팀 미팅',
    location: '회의실 C',
    category: '업무',
    repeat: { type: 'weekly', interval: 1 },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.saveRepeatedEvents(newRepeatedEventData, 2);
  });

  expect(result.current.events).toHaveLength(3);
  expect(result.current.events[1]?.repeat.id).toBe('1');
  expect(result.current.events[2]?.repeat.id).toBe('1');
  expect(toastFn).toHaveBeenCalledWith({
    title: '반복 일정이 저장되었습니다.',
    status: 'info',
    duration: 3000,
    isClosable: true,
  });
  server.resetHandlers();
});

it("반복 일정 저장 실패 시 '반복 일정 저장 실패' 토스트가 노출되어야 한다", async () => {
  server.use(
    http.post('/api/events-list', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  const { result } = renderHook(() => useEventOperations(false));
  await act(() => Promise.resolve(null));

  const newRepeatedEventData: EventForm = {
    title: '실패할 반복 회의',
    date: '2025-11-01',
    startTime: '10:00',
    endTime: '11:00',
    repeat: { type: 'daily', interval: 1 },
    description: '설명',
    location: '장소',
    category: '카테고리',
    notificationTime: 0,
  };

  await act(async () => {
    await result.current.saveRepeatedEvents(newRepeatedEventData, 1);
  });

  expect(toastFn).toHaveBeenCalledWith({
    title: '반복 일정 저장 실패',
    status: 'error',
    duration: 3000,
    isClosable: true,
  });
  expect(result.current.events).toHaveLength(1);
  server.resetHandlers();
});

it('특정 repeatId를 가진 모든 반복 일정이 정상적으로 삭제된다', async () => {
  const initialEventsWithRepeats: Event[] = [
    {
      id: '0',
      title: '반복 없는 회의',
      date: '2025-11-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '설명',
      location: '장소 A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
    {
      id: '1',
      title: '주간 반복 1-1',
      date: '2025-11-05',
      startTime: '14:00',
      endTime: '15:00',
      description: '주간 반복 설명',
      location: '회의실 C',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, id: '1' },
      notificationTime: 5,
    },
    {
      id: '2',
      title: '주간 반복 1-2',
      date: '2025-11-12',
      startTime: '14:00',
      endTime: '15:00',
      description: '주간 반복 설명 2',
      location: '회의실 C',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, id: '1' },
      notificationTime: 5,
    },
    {
      id: '3',
      title: '다른 그룹 반복',
      date: '2025-11-06',
      startTime: '16:00',
      endTime: '17:00',
      description: '다른 그룹 설명',
      location: '온라인',
      category: '개인',
      repeat: { type: 'daily', interval: 1, id: '2' },
      notificationTime: 15,
    },
  ];

  const idsToDelete = ['1', '2'];
  let getEventsCallCount = 0;

  server.use(
    http.get('/api/events', () => {
      getEventsCallCount++;
      if (getEventsCallCount === 1) {
        // 훅 마운트 시
        return HttpResponse.json({ events: initialEventsWithRepeats });
      }
      if (getEventsCallCount === 2) {
        // deleteAllRepeatedEvents 내부 첫 fetchEvents
        return HttpResponse.json({ events: initialEventsWithRepeats });
      }
      // deleteAllRepeatedEvents 내부 두 번째 fetchEvents (삭제 후)
      return HttpResponse.json({
        events: initialEventsWithRepeats.filter((event) => event.repeat.id !== '1'),
      });
    }),
    http.delete('/api/events-list', async ({ request }) => {
      const { eventIds } = (await request.json()) as { eventIds: string[] };
      expect(eventIds).toEqual(idsToDelete);
      return HttpResponse.json({ message: 'Events deleted' }, { status: 200 });
    })
  );

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));
  expect(result.current.events).toEqual<Event[]>(initialEventsWithRepeats);
  expect(toastFn).toHaveBeenCalledWith(expect.objectContaining({ title: '일정 로딩 완료!' }));
  toastFn.mockClear();

  await act(async () => {
    await result.current.deleteAllRepeatedEvents('1');
  });

  expect(result.current.events).toHaveLength(2);
  expect(result.current.events.find((e) => e.repeat.id === '1')).toBeUndefined();
  expect(toastFn).toHaveBeenCalledTimes(1);
  expect(toastFn).toHaveBeenCalledWith({
    title: '반복 일정이 모두 삭제되었습니다.',
    status: 'info',
    duration: 3000,
    isClosable: true,
  });
});

it("반복 일정 모두 삭제 실패 시 '반복 일정 모두 삭제 실패' 토스트가 노출되어야 한다", async () => {
  server.use(
    http.delete('/api/events-list', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  const { result } = renderHook(() => useEventOperations(false));
  await act(() => Promise.resolve(null));
  const initialEventCount = result.current.events.length;

  await act(async () => {
    await result.current.deleteAllRepeatedEvents('test-repeat-id-failure');
  });

  expect(toastFn).toHaveBeenCalledWith({
    title: '반복 일정 모두 삭제 실패',
    status: 'error',
    duration: 3000,
    isClosable: true,
  });
  expect(result.current.events).toHaveLength(initialEventCount);
  server.resetHandlers();
});

it('모든 일정이 정상적으로 삭제된다', async () => {
  const allEvents: Event[] = [
    {
      id: '1',
      title: '회의 1',
      date: '2025-12-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '설명1',
      location: '회의실A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
    {
      id: '2',
      title: '약속',
      date: '2025-12-02',
      startTime: '14:00',
      endTime: '15:00',
      description: '개인 약속',
      location: '카페',
      category: '개인',
      repeat: { type: 'daily', interval: 1, id: '1' },
      notificationTime: 5,
    },
  ];
  let initialFetchForDeleteAllDone = false;

  server.use(
    http.get('/api/events', ({ _request }) => {
      if (!initialFetchForDeleteAllDone) {
        initialFetchForDeleteAllDone = true;
        return HttpResponse.json({ events: allEvents });
      }
      return HttpResponse.json({ events: [] });
    }),
    http.delete('/api/events-list', async ({ request }) => {
      const { eventIds } = (await request.json()) as { eventIds: string[] };
      expect(eventIds).toEqual(allEvents.map((e) => e.id));
      return HttpResponse.json({ message: 'All events deleted' }, { status: 200 });
    })
  );

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));
  expect(result.current.events).toEqual<Event[]>(allEvents);

  await act(async () => {
    await result.current.deleteAllEvents();
  });

  expect(result.current.events).toEqual<Event[]>([]);
  expect(toastFn).toHaveBeenCalledWith({
    title: '일정이 모두 삭제되었습니다.',
    status: 'info',
    duration: 3000,
    isClosable: true,
  });
  server.resetHandlers();
  initialFetchForDeleteAllDone = false;
});

it("일정 모두 삭제 실패 시 '일정 모두 삭제 실패' 토스트가 노출되어야 한다", async () => {
  server.use(
    http.delete('/api/events-list', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  const { result } = renderHook(() => useEventOperations(false));
  await act(() => Promise.resolve(null));
  const initialEventCount = result.current.events.length;

  await act(async () => {
    await result.current.deleteAllEvents();
  });

  expect(toastFn).toHaveBeenCalledWith({
    title: '일정 모두 삭제 실패',
    status: 'error',
    duration: 3000,
    isClosable: true,
  });
  expect(result.current.events).toHaveLength(initialEventCount);
  server.resetHandlers();
});
