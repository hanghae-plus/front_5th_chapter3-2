import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
  setupMockHandlerRecurringCreation,
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

// 반복 일정
describe('반복 일정', () => {
  it(`매일 반복되는 이벤트를 저장하면 하루 간격으로 일정이 생성된다.`, async () => {
    setupMockHandlerRecurringCreation();

    const { result } = renderHook(() => useEventOperations(false));
    const newEvent: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2025-09-24',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1 },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatedEvents(newEvent);
    });

    expect(result.current.events).toEqual([
      {
        id: '2',
        title: '새로운 반복 이벤트',
        date: '2025-09-24',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, id: '1' },
        notificationTime: 10,
      },
      {
        id: '3',
        title: '새로운 반복 이벤트',
        date: '2025-09-25',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, id: '1' },
        notificationTime: 10,
      },
      {
        id: '4',
        title: '새로운 반복 이벤트',
        date: '2025-09-26',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, id: '1' },
        notificationTime: 10,
      },
      {
        id: '5',
        title: '새로운 반복 이벤트',
        date: '2025-09-27',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, id: '1' },
        notificationTime: 10,
      },
      {
        id: '6',
        title: '새로운 반복 이벤트',
        date: '2025-09-28',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, id: '1' },
        notificationTime: 10,
      },
      {
        id: '7',
        title: '새로운 반복 이벤트',
        date: '2025-09-29',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, id: '1' },
        notificationTime: 10,
      },
      {
        id: '8',
        title: '새로운 반복 이벤트',
        date: '2025-09-30',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, id: '1' },
        notificationTime: 10,
      },
    ]);
  });

  it(`이틀마다 반복되는 이벤트를 저장하면 이틀 간격으로 일정이 생성된다.`, async () => {
    setupMockHandlerRecurringCreation();

    const { result } = renderHook(() => useEventOperations(false));
    const newEvent: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2025-10-16',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 2, endDate: '2025-10-30' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatedEvents(newEvent);
    });

    expect(result.current.events).toEqual([
      {
        id: '2',
        title: '새로운 반복 이벤트',
        date: '2025-10-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 2, id: '1', endDate: '2025-10-30' },
        notificationTime: 10,
      },
      {
        id: '3',
        title: '새로운 반복 이벤트',
        date: '2025-10-18',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 2, id: '1', endDate: '2025-10-30' },
        notificationTime: 10,
      },
      {
        id: '4',
        title: '새로운 반복 이벤트',
        date: '2025-10-20',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 2, id: '1', endDate: '2025-10-30' },
        notificationTime: 10,
      },
      {
        id: '5',
        title: '새로운 반복 이벤트',
        date: '2025-10-22',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 2, id: '1', endDate: '2025-10-30' },
        notificationTime: 10,
      },
      {
        id: '6',
        title: '새로운 반복 이벤트',
        date: '2025-10-24',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 2, id: '1', endDate: '2025-10-30' },
        notificationTime: 10,
      },
      {
        id: '7',
        title: '새로운 반복 이벤트',
        date: '2025-10-26',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 2, id: '1', endDate: '2025-10-30' },
        notificationTime: 10,
      },
      {
        id: '8',
        title: '새로운 반복 이벤트',
        date: '2025-10-28',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 2, id: '1', endDate: '2025-10-30' },
        notificationTime: 10,
      },
      {
        id: '9',
        title: '새로운 반복 이벤트',
        date: '2025-10-30',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 2, id: '1', endDate: '2025-10-30' },
        notificationTime: 10,
      },
    ]);
  });

  it(`5일마다 반복되는 이벤트를 저장하면 5일 간격으로 일정이 생성된다.`, async () => {
    setupMockHandlerRecurringCreation();

    const { result } = renderHook(() => useEventOperations(false));
    const newEvent: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2025-08-20',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 5, endDate: '2025-09-12' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatedEvents(newEvent);
    });

    expect(result.current.events.slice(0, 5)).toEqual([
      {
        id: '2',
        title: '새로운 반복 이벤트',
        date: '2025-08-20',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 5, id: '1', endDate: '2025-09-12' },
        notificationTime: 10,
      },
      {
        id: '3',
        title: '새로운 반복 이벤트',
        date: '2025-08-25',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 5, id: '1', endDate: '2025-09-12' },
        notificationTime: 10,
      },
      {
        id: '4',
        title: '새로운 반복 이벤트',
        date: '2025-08-30',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 5, id: '1', endDate: '2025-09-12' },
        notificationTime: 10,
      },
      {
        id: '5',
        title: '새로운 반복 이벤트',
        date: '2025-09-04',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 5, id: '1', endDate: '2025-09-12' },
        notificationTime: 10,
      },
      {
        id: '6',
        title: '새로운 반복 이벤트',
        date: '2025-09-09',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 5, id: '1', endDate: '2025-09-12' },
        notificationTime: 10,
      },
    ]);
  });

  it(`매주 반복되는 이벤트를 저장하면 일주일 간격으로 일정이 생성된다.`, async () => {
    setupMockHandlerRecurringCreation();

    const { result } = renderHook(() => useEventOperations(false));
    const newEvent: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2025-08-17',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 1 },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatedEvents(newEvent);
    });

    expect(result.current.events).toEqual([
      {
        id: '2',
        title: '새로운 반복 이벤트',
        date: '2025-08-17',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, id: '1' },
        notificationTime: 10,
      },
      {
        id: '3',
        title: '새로운 반복 이벤트',
        date: '2025-08-24',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, id: '1' },
        notificationTime: 10,
      },
      {
        id: '4',
        title: '새로운 반복 이벤트',
        date: '2025-08-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, id: '1' },
        notificationTime: 10,
      },
      {
        id: '5',
        title: '새로운 반복 이벤트',
        date: '2025-09-07',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, id: '1' },
        notificationTime: 10,
      },
      {
        id: '6',
        title: '새로운 반복 이벤트',
        date: '2025-09-14',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, id: '1' },
        notificationTime: 10,
      },
      {
        id: '7',
        title: '새로운 반복 이벤트',
        date: '2025-09-21',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, id: '1' },
        notificationTime: 10,
      },
      {
        id: '8',
        title: '새로운 반복 이벤트',
        date: '2025-09-28',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, id: '1' },
        notificationTime: 10,
      },
    ]);
  });
  it(`3주마다 반복되는 일정을 저장하면 3주 간격으로 일정이 생성된다.`, async () => {
    setupMockHandlerRecurringCreation();

    const { result } = renderHook(() => useEventOperations(false));
    const newEvent: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2025-10-16',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 3, endDate: '2025-12-31' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatedEvents(newEvent);
    });

    expect(result.current.events.slice(0, 5)).toEqual([
      {
        id: '2',
        title: '새로운 반복 이벤트',
        date: '2025-10-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 3, id: '1', endDate: '2025-12-31' },
        notificationTime: 10,
      },
      {
        id: '3',
        title: '새로운 반복 이벤트',
        date: '2025-11-06',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 3, id: '1', endDate: '2025-12-31' },
        notificationTime: 10,
      },
      {
        id: '4',
        title: '새로운 반복 이벤트',
        date: '2025-11-27',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 3, id: '1', endDate: '2025-12-31' },
        notificationTime: 10,
      },
      {
        id: '5',
        title: '새로운 반복 이벤트',
        date: '2025-12-18',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 3, id: '1', endDate: '2025-12-31' },
        notificationTime: 10,
      },
    ]);
  });

  it(`매달 반복되는 일정을 저장하면 한달 간격으로 일정이 생성된다.`, async () => {
    setupMockHandlerRecurringCreation();

    const { result } = renderHook(() => useEventOperations(false));
    const newEvent: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2025-10-16',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2026-03-01' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatedEvents(newEvent);
    });

    expect(result.current.events).toEqual([
      {
        id: '2',
        title: '새로운 반복 이벤트',
        date: '2025-10-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, id: '1', endDate: '2026-03-01' },
        notificationTime: 10,
      },
      {
        id: '3',
        title: '새로운 반복 이벤트',
        date: '2025-11-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, id: '1', endDate: '2026-03-01' },
        notificationTime: 10,
      },
      {
        id: '4',
        title: '새로운 반복 이벤트',
        date: '2025-12-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, id: '1', endDate: '2026-03-01' },
        notificationTime: 10,
      },
      {
        id: '5',
        title: '새로운 반복 이벤트',
        date: '2026-01-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, id: '1', endDate: '2026-03-01' },
        notificationTime: 10,
      },
      {
        id: '6',
        title: '새로운 반복 이벤트',
        date: '2026-02-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, id: '1', endDate: '2026-03-01' },
        notificationTime: 10,
      },
    ]);
  });
  it(`5달마다 반복되는 일정을 저장하면 5달 간격으로 일정이 생성된다.`, async () => {
    setupMockHandlerRecurringCreation();

    const { result } = renderHook(() => useEventOperations(false));
    const newEvent: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2025-10-16',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 5, endDate: '2027-03-01' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatedEvents(newEvent);
    });

    expect(result.current.events.slice(0, 5)).toEqual([
      {
        id: '2',
        title: '새로운 반복 이벤트',
        date: '2025-10-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 5, id: '1', endDate: '2027-03-01' },
        notificationTime: 10,
      },
      {
        id: '3',
        title: '새로운 반복 이벤트',
        date: '2026-03-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 5, id: '1', endDate: '2027-03-01' },
        notificationTime: 10,
      },
      {
        id: '4',
        title: '새로운 반복 이벤트',
        date: '2026-08-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 5, id: '1', endDate: '2027-03-01' },
        notificationTime: 10,
      },
      {
        id: '5',
        title: '새로운 반복 이벤트',
        date: '2027-01-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 5, id: '1', endDate: '2027-03-01' },
        notificationTime: 10,
      },
    ]);
  });

  it(`매년 반복되는 일정을 저장하면 1년 간격으로 일정이 생성된다.`, async () => {
    setupMockHandlerRecurringCreation();

    const { result } = renderHook(() => useEventOperations(false));
    const newEvent: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2021-10-16',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'yearly', interval: 1 },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatedEvents(newEvent);
    });

    expect(result.current.events).toEqual([
      {
        id: '2',
        title: '새로운 반복 이벤트',
        date: '2021-10-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 1, id: '1' },
        notificationTime: 10,
      },
      {
        id: '3',
        title: '새로운 반복 이벤트',
        date: '2022-10-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 1, id: '1' },
        notificationTime: 10,
      },
      {
        id: '4',
        title: '새로운 반복 이벤트',
        date: '2023-10-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 1, id: '1' },
        notificationTime: 10,
      },
      {
        id: '5',
        title: '새로운 반복 이벤트',
        date: '2024-10-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 1, id: '1' },
        notificationTime: 10,
      },
    ]);
  });
  it(`3년마다 반복되는 일정을 저장하면 3년 간격으로 일정이 생성된다.`, async () => {
    setupMockHandlerRecurringCreation();

    const { result } = renderHook(() => useEventOperations(false));
    const newEvent: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2025-10-16',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'yearly', interval: 3, endDate: '2031-11-14' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatedEvents(newEvent);
    });

    expect(result.current.events).toEqual([
      {
        id: '2',
        title: '새로운 반복 이벤트',
        date: '2025-10-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 3, id: '1', endDate: '2031-11-14' },
        notificationTime: 10,
      },
      {
        id: '3',
        title: '새로운 반복 이벤트',
        date: '2028-10-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 3, id: '1', endDate: '2031-11-14' },
        notificationTime: 10,
      },
      {
        id: '4',
        title: '새로운 반복 이벤트',
        date: '2031-10-16',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 3, id: '1', endDate: '2031-11-14' },
        notificationTime: 10,
      },
    ]);
  });

  it(`2월 29일마다 반복되는 일정을 저장하면 평년의 2월은 제외하고 일정이 생성된다.`, async () => {
    setupMockHandlerRecurringCreation();

    const { result } = renderHook(() => useEventOperations(false));
    const newEvent: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2024-02-29',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'yearly', interval: 1, endDate: '2034-03-01' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatedEvents(newEvent);
    });

    expect(result.current.events).toEqual([
      {
        id: '2',
        title: '새로운 반복 이벤트',
        date: '2024-02-29',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 1, id: '1', endDate: '2034-03-01' },
        notificationTime: 10,
      },
      {
        id: '3',
        title: '새로운 반복 이벤트',
        date: '2028-02-29',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 1, id: '1', endDate: '2034-03-01' },
        notificationTime: 10,
      },
      {
        id: '4',
        title: '새로운 반복 이벤트',
        date: '2032-02-29',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 1, id: '1', endDate: '2034-03-01' },
        notificationTime: 10,
      },
    ]);
  });

  it(`30일마다 반복되는 일정을 저장하면 30일이 없는 달은 제외하고 일정이 생성된다.`, async () => {
    setupMockHandlerRecurringCreation();

    const { result } = renderHook(() => useEventOperations(false));
    const newEvent: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2025-01-30',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-05-31' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatedEvents(newEvent);
    });

    expect(result.current.events.slice(0, 5)).toEqual([
      {
        id: '2',
        title: '새로운 반복 이벤트',
        date: '2025-01-30',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, id: '1', endDate: '2025-05-31' },
        notificationTime: 10,
      },
      {
        id: '3',
        title: '새로운 반복 이벤트',
        date: '2025-03-30',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, id: '1', endDate: '2025-05-31' },
        notificationTime: 10,
      },
      {
        id: '4',
        title: '새로운 반복 이벤트',
        date: '2025-04-30',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, id: '1', endDate: '2025-05-31' },
        notificationTime: 10,
      },
      {
        id: '5',
        title: '새로운 반복 이벤트',
        date: '2025-05-30',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, id: '1', endDate: '2025-05-31' },
        notificationTime: 10,
      },
    ]);
  });
  it(`31마다 반복되는 일정을 저장하면 31일이 없는 달은 제외하고 일정이 생성된다.`, async () => {
    setupMockHandlerRecurringCreation();

    const { result } = renderHook(() => useEventOperations(false));
    const newEvent: EventForm = {
      title: '새로운 반복 이벤트',
      date: '2025-01-31',
      startTime: '09:00',
      endTime: '10:00',
      description: '새로운 이벤트입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-07-31' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatedEvents(newEvent);
    });

    let lastId = result.current.events.length + 1;

    expect(result.current.events).toEqual([
      {
        id: '2',
        title: '새로운 반복 이벤트',
        date: '2025-01-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, id: '1', endDate: '2025-07-31' },
        notificationTime: 10,
      },
      {
        id: '3',
        title: '새로운 반복 이벤트',
        date: '2025-03-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, id: '1', endDate: '2025-07-31' },
        notificationTime: 10,
      },
      {
        id: '4',
        title: '새로운 반복 이벤트',
        date: '2025-05-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, id: '1', endDate: '2025-07-31' },
        notificationTime: 10,
      },
      {
        id: '5',
        title: '새로운 반복 이벤트',
        date: '2025-07-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '새로운 이벤트입니다.',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, id: '1', endDate: '2025-07-31' },
        notificationTime: 10,
      },
    ]);
  });

  it('존재하는 반복 일정 삭제 시 에러없이 해당 아이템만 삭제된다.', async () => {
    setupMockHandlerDeletion();

    const { result } = renderHook(() => useEventOperations(false));

    await act(async () => {
      await result.current.deleteRepeatedEvents(['2']);
    });

    await act(() => Promise.resolve(null));

    expect(result.current.events).toEqual([
      {
        id: '1',
        title: '삭제할 이벤트',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '삭제할 이벤트입니다',
        location: '어딘가',
        category: '기타',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
      {
        id: '3',
        title: '삭제할 반복 이벤트',
        date: '2025-10-17',
        startTime: '09:00',
        endTime: '10:00',
        description: '삭제할 이벤트입니다',
        location: '어딘가',
        category: '기타',
        repeat: { type: 'daily', interval: 1 },
        notificationTime: 10,
      },
      {
        id: '4',
        title: '삭제할 반복 이벤트',
        date: '2025-10-18',
        startTime: '09:00',
        endTime: '10:00',
        description: '삭제할 이벤트입니다',
        location: '어딘가',
        category: '기타',
        repeat: { type: 'daily', interval: 1 },
        notificationTime: 10,
      },
      {
        id: '5',
        title: '삭제할 반복 이벤트',
        date: '2025-10-19',
        startTime: '09:00',
        endTime: '10:00',
        description: '삭제할 이벤트입니다',
        location: '어딘가',
        category: '기타',
        repeat: { type: 'daily', interval: 1 },
        notificationTime: 10,
      },
      {
        id: '6',
        title: '삭제할 반복 이벤트',
        date: '2025-10-20',
        startTime: '09:00',
        endTime: '10:00',
        description: '삭제할 이벤트입니다',
        location: '어딘가',
        category: '기타',
        repeat: { type: 'daily', interval: 1 },
        notificationTime: 10,
      },
      {
        id: '7',
        title: '삭제할 반복 이벤트',
        date: '2025-10-21',
        startTime: '09:00',
        endTime: '10:00',
        description: '삭제할 이벤트입니다',
        location: '어딘가',
        category: '기타',
        repeat: { type: 'daily', interval: 1 },
        notificationTime: 10,
      },
    ]);
  });
  // TODO: 반복 일정을 수정
});
