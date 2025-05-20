import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerRepeatedEventCreation,
  setupMockHandlerRepeatedEventDeletion,
  setupMockHandlerUpdating,
} from '../../__mocks__/handlersUtils.ts';
import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { server } from '../../setupTests.ts';
import { Event } from '../../types.ts';

const toastFn = vi.fn();

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => toastFn,
  };
});

it('저장되어있는 초기 이벤트 데이터를 적절하게 불러온다', async () => {
  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  expect(result.current.events).toEqual([
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
});

it('정의된 이벤트 정보를 기준으로 적절하게 저장이 된다', async () => {
  setupMockHandlerCreation(); // ? Med: 이걸 왜 써야하는지 물어보자

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

  expect(result.current.events).toEqual([{ ...newEvent, id: '1' }]);
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

  expect(result.current.events[0]).toEqual(updatedEvent);
});

it('존재하는 이벤트 삭제 시 에러없이 아이템이 삭제된다.', async () => {
  setupMockHandlerDeletion();

  const { result } = renderHook(() => useEventOperations(false));

  await act(async () => {
    await result.current.deleteEvent('1');
  });

  await act(() => Promise.resolve(null));

  expect(result.current.events).toEqual([]);
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
    id: '999', // 존재하지 않는 ID
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

describe('반복 일정 생성', () => {
  it('매일 반복되는 일정이 올바르게 저장된다.', async () => {
    setupMockHandlerRepeatedEventCreation();
    const { result } = renderHook(() => useEventOperations(false));
    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      id: '1',
      title: '발제 과제하기,,,힘내',
      date: '2025-05-18',
      startTime: '13:00',
      endTime: '18:00',
      description: '과제는 매일 하는 거다 이녀석아',
      location: '우리집',
      category: '개인',
      repeat: { type: 'daily', interval: 1, endDate: '2025-05-22' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatedEvents(newEvent);
    });

    expect(result.current.events).toHaveLength(5);

    expect(result.current.events).toEqual([
      {
        ...newEvent,
      },
      {
        ...newEvent,
        id: '2',
        date: '2025-05-19',
      },
      {
        ...newEvent,
        id: '3',
        date: '2025-05-20',
      },
      {
        ...newEvent,
        id: '4',
        date: '2025-05-21',
      },
      {
        ...newEvent,
        id: '5',
        date: '2025-05-22',
      },
    ]);
  });

  it('매주 반복되는 일정이 올바르게 저장된다.', async () => {
    setupMockHandlerRepeatedEventCreation();
    const { result } = renderHook(() => useEventOperations(false));
    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      id: '1',
      title: '발제',
      date: '2025-05-17',
      startTime: '13:00',
      endTime: '18:00',
      description: '앞으로 남은 발제들,,',
      location: '우리집',
      category: '개인',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-06-06' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatedEvents(newEvent);
    });

    expect(result.current.events).toHaveLength(3);

    expect(result.current.events).toEqual([
      {
        ...newEvent,
      },
      {
        ...newEvent,
        id: '2',
        date: '2025-05-24',
      },
      {
        ...newEvent,
        id: '3',
        date: '2025-05-31',
      },
    ]);
  });

  it('세 달마다 반복되는 일정이 올바르게 저장된다', async () => {
    setupMockHandlerRepeatedEventCreation();
    const { result } = renderHook(() => useEventOperations(false));
    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      id: '1',
      title: '병원 정기 검진',
      date: '2025-05-01',
      startTime: '13:00',
      endTime: '18:00',
      description: '경희대병원',
      location: '병원',
      category: '개인',
      repeat: { type: 'monthly', interval: 3, endDate: '2026-03-01' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatedEvents(newEvent);
    });

    expect(result.current.events).toHaveLength(4);

    expect(result.current.events).toEqual([
      {
        ...newEvent,
      },
      {
        ...newEvent,
        id: '2',
        date: '2025-08-01',
      },
      {
        ...newEvent,
        id: '3',
        date: '2025-11-01',
      },
      {
        ...newEvent,
        id: '4',
        date: '2026-02-01',
      },
    ]);
  });

  it('격년 반복되는 일정이 올바르게 저장된다', async () => {
    setupMockHandlerRepeatedEventCreation();
    const { result } = renderHook(() => useEventOperations(false));
    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      id: '1',
      title: '격년 크리스마스',
      date: '2024-12-25',
      startTime: '13:00',
      endTime: '18:00',
      description: '크리수마스 파뤼',
      location: '우리집',
      category: '개인',
      repeat: { type: 'yearly', interval: 2, endDate: '2030-12-31' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatedEvents(newEvent);
    });

    expect(result.current.events).toHaveLength(4);

    expect(result.current.events).toEqual([
      {
        ...newEvent,
      },
      {
        ...newEvent,
        id: '2',
        date: '2026-12-25',
      },
      {
        ...newEvent,
        id: '3',
        date: '2028-12-25',
      },
      {
        ...newEvent,
        id: '4',
        date: '2030-12-25',
      },
    ]);
  });

  it('31일에 매월 반복되는 일정을 설정하면 31일이 있는 달만 일정이 생성된다', async () => {
    setupMockHandlerRepeatedEventCreation();
    const { result } = renderHook(() => useEventOperations(false));
    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      id: '1',
      title: '31일은 베라데이',
      date: '2025-05-31',
      startTime: '13:00',
      endTime: '18:00',
      description: '베라데이',
      location: '우리집',
      category: '개인',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-10-01' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatedEvents(newEvent);
    });

    expect(result.current.events).toHaveLength(3);

    expect(result.current.events).toEqual([
      {
        ...newEvent,
      },
      {
        ...newEvent,
        id: '2',
        date: '2025-07-31',
      },
      {
        ...newEvent,
        id: '3',
        date: '2025-08-31',
      },
    ]);
  });

  it('2월 29일에 매년 반복되는 일정을 설정하면 윤년에만 일정이 생성된다.', async () => {
    setupMockHandlerRepeatedEventCreation();
    const { result } = renderHook(() => useEventOperations(false));
    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      id: '1',
      title: '31일은 베라데이',
      date: '2025-05-31',
      startTime: '13:00',
      endTime: '18:00',
      description: '베라데이',
      location: '우리집',
      category: '개인',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-10-01' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatedEvents(newEvent);
    });

    expect(result.current.events).toHaveLength(3);

    expect(result.current.events).toEqual([
      {
        ...newEvent,
      },
      {
        ...newEvent,
        id: '2',
        date: '2025-07-31',
      },
      {
        ...newEvent,
        id: '3',
        date: '2025-08-31',
      },
    ]);
  });
});

describe('반복 일정 삭제', () => {
  it('반복 일정 중 하나를 삭제하면 해당 일정만 삭제된다.', async () => {
    const { result } = renderHook(() => useEventOperations(false));
    await act(() => Promise.resolve(null));

    const initialEvents: Event[] = [
      {
        id: '1',
        title: '매월 반복',
        date: '2025-07-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '월간 보고',
        location: '본사',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-09-01', id: 'repeat-id' },
        notificationTime: 60,
      },
      {
        id: '2',
        title: '매월 반복',
        date: '2025-08-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '월간 보고',
        location: '본사',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-09-01', id: 'repeat-id' },
        notificationTime: 60,
      },
      {
        id: '3',
        title: '매월 반복',
        date: '2025-09-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '월간 보고',
        location: '본사',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-09-01', id: 'repeat-id' },
        notificationTime: 60,
      },
    ];

    let mockEventsData = [...initialEvents];

    server.use(
      http.get('/api/events', () => HttpResponse.json({ events: mockEventsData })),
      http.delete('/api/events/:id', ({ params }) => {
        const { id } = params;
        mockEventsData = mockEventsData.filter((event) => event.id !== id);
        return new HttpResponse(null, { status: 204 });
      })
    );

    await act(async () => {
      await result.current.deleteEvent('2');
    });
    await act(() => Promise.resolve(null));

    expect(result.current.events.find((e) => e.id === '2')).toBeUndefined();
    expect(result.current.events.find((e) => e.id === '1')).toBeDefined();
    expect(result.current.events.find((e) => e.id === '3')).toBeDefined();
    expect(result.current.events.filter((e) => e.repeat.id === 'repeat-id')).toHaveLength(2);
    expect(result.current.events).toHaveLength(2);
  });

  it('반복 일정 전체 삭제를 하면 같은 반복 일정이 다 삭제된다.', async () => {
    setupMockHandlerRepeatedEventDeletion();

    const { result } = renderHook(() => useEventOperations(false));
    await act(() => Promise.resolve(null));

    await act(async () => {
      await result.current.deleteAllRepeatedEvents('repeat-id');
    });

    await act(() => Promise.resolve(null));

    const keptEvent = result.current.events.find((e) => e.id === '4');
    expect(keptEvent).toBeDefined();
    expect(result.current.events).toHaveLength(1);
  });
});
