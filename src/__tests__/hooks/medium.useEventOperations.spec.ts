import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerRepeat,
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

describe('반복 이벤트 저장', () => {
  const mockEvent = {
    id: '1',
    title: '반복 이벤트',
    date: '2025-10-16',
    startTime: '11:00',
    endTime: '12:00',
    description: '반복 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 5,
  };
  it('일간 반복으로 마감일이 1주일 뒤 라면 새로운 7개의 이벤트가 저장되어야 한다', async () => {
    setupMockHandlerRepeat();
    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));
    console.log(result.current.events);
    const newEvent: Event = {
      ...mockEvent,
      date: '2025-10-16',
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-22' },
    };

    // 이벤트 날짜가 10월 16일부터 10월 22일까지 일간 반복으로 저장되어야 한다
    const answer = [
      '2025-10-16',
      '2025-10-17',
      '2025-10-18',
      '2025-10-19',
      '2025-10-20',
      '2025-10-21',
      '2025-10-22',
    ];

    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    // 7개의 이벤트가 저장되어야 한다
    expect(result.current.events).toHaveLength(answer.length);

    expect(result.current.events.map((event) => event.date)).toEqual(answer);
  });

  it('주간 반복으로 마감일이 1달 뒤 라면 달에 맞는 개수의 이벤트가 저장되어야 한다', async () => {
    setupMockHandlerRepeat();
    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      ...mockEvent,
      date: '2025-10-16',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-11-15' },
    };

    const answer = ['2025-10-16', '2025-10-23', '2025-10-30', '2025-11-06', '2025-11-13'];
    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    expect(result.current.events).toHaveLength(answer.length);

    expect(result.current.events.map((event) => event.date)).toEqual(answer);
  });

  it('월간 반복으로 마감일이 1년 뒤 라면 새로운 13개의 이벤트가 저장되어야 한다', async () => {
    setupMockHandlerRepeat();

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      ...mockEvent,
      date: '2025-10-16',
      repeat: { type: 'monthly', interval: 1, endDate: '2026-10-16' },
    };
    const answer = [
      '2025-10-16',
      '2025-11-16',
      '2025-12-16',
      '2026-01-16',
      '2026-02-16',
      '2026-03-16',
      '2026-04-16',
      '2026-05-16',
      '2026-06-16',
      '2026-07-16',
      '2026-08-16',
      '2026-09-16',
      '2026-10-16',
    ];

    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    await act(() => Promise.resolve(null));
    console.log(result.current.events);

    expect(result.current.events).toHaveLength(answer.length);

    expect(result.current.events.map((event) => event.date)).toEqual(answer);
  });

  it('일간 반복으로 마감일이 없을 경우 25.9.30 까지 반복된다.', async () => {
    setupMockHandlerRepeat();
    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      ...mockEvent,
      date: '2025-09-27',
      repeat: { type: 'daily', interval: 1 },
    };
    const answer = ['2025-09-27', '2025-09-28', '2025-09-29', '2025-09-30'];

    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    console.log(result.current.events);

    expect(result.current.events).toHaveLength(answer.length);

    expect(result.current.events.map((event) => event.date)).toEqual(answer);
  });

  it('월간 반복으로 마감일이 없을 경우 25.9.30 까지 반복된다.', async () => {
    setupMockHandlerRepeat();
    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      ...mockEvent,
      date: '2025-01-16',
      repeat: { type: 'monthly', interval: 1 },
    };
    const answer = [
      '2025-01-16',
      '2025-02-16',
      '2025-03-16',
      '2025-04-16',
      '2025-05-16',
      '2025-06-16',
      '2025-07-16',
      '2025-08-16',
      '2025-09-16',
    ];

    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    expect(result.current.events).toHaveLength(answer.length);

    expect(result.current.events.map((event) => event.date)).toEqual(answer);
  });
});

describe('반복 이벤트 수정', () => {
  const mockEvent: Event = {
    id: '1',
    title: '반복 이벤트',
    date: '2025-05-16',
    repeat: { type: 'daily', interval: 1, endDate: '2025-05-18' },
    startTime: '11:00',
    endTime: '12:00',
    description: '반복 팀 미팅',
    location: '회의실 A',
    category: '업무',
    notificationTime: 5,
  };

  const mockEvents: Event[] = [
    {
      ...mockEvent,
      id: '1',
      date: '2025-05-16',
      repeat: { type: 'daily', interval: 1 },
    },
    {
      ...mockEvent,
      id: '2',
      date: '2025-05-17',
      repeat: { type: 'daily', interval: 1 },
    },
    {
      ...mockEvent,
      id: '3',
      date: '2025-05-18',
      repeat: { type: 'daily', interval: 1 },
    },
  ];
  it('반복 이벤트 수정시 단일 이벤트로 변경된다.', async () => {
    setupMockHandlerRepeat(mockEvents);

    const { result } = renderHook(() => useEventOperations(true));

    await act(() => Promise.resolve(null));

    const changedTitle = '수정된 이벤트';
    const updatedEvent: Event = {
      ...mockEvents[1],
      title: changedTitle,
    };

    await act(async () => {
      await result.current.saveEvent(updatedEvent);
    });

    expect(result.current.events[1].title).toEqual(changedTitle);
    expect(result.current.events[1].date).toBe('2025-05-17');
    expect(result.current.events[1].repeat.type).toBe('none');
  });
});

describe('반복 이벤트 삭제', () => {
  const mockEvent: Event = {
    id: '1',
    title: '반복 이벤트',
    date: '2025-05-16',
    repeat: { type: 'daily', interval: 1, endDate: '2025-05-18' },
    startTime: '11:00',
    endTime: '12:00',
    description: '반복 팀 미팅',
    location: '회의실 A',
    category: '업무',
    notificationTime: 5,
  };

  const mockEvents: Event[] = [
    {
      ...mockEvent,
      id: '1',
      date: '2025-05-16',
      repeat: { type: 'daily', interval: 1 },
    },
    {
      ...mockEvent,
      id: '2',
      date: '2025-05-17',
      repeat: { type: 'daily', interval: 1 },
    },
    {
      ...mockEvent,
      id: '3',
      date: '2025-05-18',
      repeat: { type: 'daily', interval: 1 },
    },
  ];
  it('반복 이벤트 삭제시 단일 이벤트로 삭제된다.', async () => {
    setupMockHandlerRepeat(mockEvents);

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    await act(async () => {
      await result.current.deleteEvent('2');
    });

    expect(result.current.events).toHaveLength(2);
    expect(result.current.events).toEqual(mockEvents.filter((event) => event.id !== '2'));
  });
});
