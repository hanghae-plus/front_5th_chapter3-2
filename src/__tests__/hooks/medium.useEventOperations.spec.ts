import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerEventsListCreation,
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
  it('반복 이벤트 저장 시 반복 주기와 일정에 따라 반복 이벤트가 올바르게 저장된다', async () => {
    setupMockHandlerEventsListCreation();

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newRepeatEvent: Event = {
      id: '1',
      title: '새 회의',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-11-23' },
      notificationTime: 5,
    };

    await act(async () => {
      await result.current.saveRepeatEvent(newRepeatEvent);
    });

    const expectedEvents = [
      { ...newRepeatEvent, id: '1', date: '2025-10-16' },
      { ...newRepeatEvent, id: '2', date: '2025-10-23' },
      { ...newRepeatEvent, id: '3', date: '2025-10-30' },
      { ...newRepeatEvent, id: '4', date: '2025-11-06' },
      { ...newRepeatEvent, id: '5', date: '2025-11-13' },
      { ...newRepeatEvent, id: '6', date: '2025-11-20' },
    ];

    expect(result.current.events).toEqual(expectedEvents);
  });

  it('윤년 29일에 매년 반복 일정을 설정한 경우 종료 시점까지 윤년 29일에 반복 일정이 저장된다', async () => {
    setupMockHandlerEventsListCreation();

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newRepeatEvent: Event = {
      id: '1',
      title: '새 회의',
      date: '2024-02-29',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'yearly', interval: 1, endDate: '2030-02-28' },
      notificationTime: 5,
    };

    await act(async () => {
      await result.current.saveRepeatEvent(newRepeatEvent);
    });

    const expectedEvents = [
      { ...newRepeatEvent, id: '1', date: '2024-02-29' },
      { ...newRepeatEvent, id: '2', date: '2028-02-29' },
    ];
    expect(result.current.events).toEqual(expectedEvents);
  });

  it('해당 해의 31일에 매일 반복을 설정한 경우 종료 시점까지 매일 반복 일정이 저장된다', async () => {
    setupMockHandlerEventsListCreation();

    const newEvent: Event = {
      id: '1',
      title: '새 회의',
      date: '2025-12-31',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2026-01-03' },
      notificationTime: 5,
    };

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const expectedEvents = [
      { ...newEvent, id: '1', date: '2025-12-31' },
      { ...newEvent, id: '2', date: '2026-01-01' },
      { ...newEvent, id: '3', date: '2026-01-02' },
      { ...newEvent, id: '4', date: '2026-01-03' },
    ];

    await act(async () => {
      await result.current.saveRepeatEvent(newEvent);
    });

    expect(result.current.events).toEqual(expectedEvents);
  });

  it('종료 시점이 없는 경우 2025-09-30까지 반복 일정이 저장된다', async () => {
    setupMockHandlerEventsListCreation();

    const newRepeatEvent: Event = {
      id: '1',
      title: '새 회의',
      date: '2025-02-19',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1 },
      notificationTime: 5,
    };

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    await act(async () => {
      await result.current.saveRepeatEvent(newRepeatEvent);
    });

    const expectedEvents = [
      { ...newRepeatEvent, id: '1', date: '2025-02-19' },
      { ...newRepeatEvent, id: '2', date: '2025-03-19' },
      { ...newRepeatEvent, id: '3', date: '2025-04-19' },
      { ...newRepeatEvent, id: '4', date: '2025-05-19' },
      { ...newRepeatEvent, id: '5', date: '2025-06-19' },
      { ...newRepeatEvent, id: '6', date: '2025-07-19' },
      { ...newRepeatEvent, id: '7', date: '2025-08-19' },
      { ...newRepeatEvent, id: '8', date: '2025-09-19' },
    ];

    expect(result.current.events).toEqual(expectedEvents);
  });

  it('주 반복 이벤트에서 interval을 3으로 설정한 경우 3주마다 이벤트가 반복된다.', async () => {
    setupMockHandlerEventsListCreation();

    const newRepeatEvent: Event = {
      id: '1',
      title: '새 회의',
      date: '2025-02-19',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 3, endDate: '2025-03-23' },
      notificationTime: 5,
    };

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    await act(async () => {
      await result.current.saveRepeatEvent(newRepeatEvent);
    });

    const expectedEvents = [
      { ...newRepeatEvent, id: '1', date: '2025-02-19' },
      { ...newRepeatEvent, id: '2', date: '2025-03-12' },
    ];

    expect(result.current.events).toEqual(expectedEvents);
  });

  it('일 반복 이벤트에서 interval을 2으로 설정한 경우 이틀마다 이벤트가 반복된다.', async () => {
    setupMockHandlerEventsListCreation();

    const newRepeatEvent: Event = {
      id: '1',
      title: '새 회의',
      date: '2025-02-19',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 2, endDate: '2025-03-03' },
      notificationTime: 5,
    };

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    await act(async () => {
      await result.current.saveRepeatEvent(newRepeatEvent);
    });

    const expectedEvents = [
      { ...newRepeatEvent, id: '1', date: '2025-02-19' },
      { ...newRepeatEvent, id: '2', date: '2025-02-21' },
      { ...newRepeatEvent, id: '3', date: '2025-02-23' },
      { ...newRepeatEvent, id: '4', date: '2025-02-25' },
      { ...newRepeatEvent, id: '5', date: '2025-02-27' },
      { ...newRepeatEvent, id: '6', date: '2025-03-01' },
      { ...newRepeatEvent, id: '7', date: '2025-03-03' },
    ];

    expect(result.current.events).toEqual(expectedEvents);
  });

  it('월 반복 이벤트에서 interval을 2으로 설정한 경우 2달마다 이벤트가 반복된다.', async () => {
    setupMockHandlerEventsListCreation();
    const newRepeatEvent: Event = {
      id: '1',
      title: '새 회의',
      date: '2025-02-19',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 2, endDate: '2025-08-03' },
      notificationTime: 5,
    };

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    await act(async () => {
      await result.current.saveRepeatEvent(newRepeatEvent);
    });

    const expectedEvents = [
      { ...newRepeatEvent, id: '1', date: '2025-02-19' },
      { ...newRepeatEvent, id: '2', date: '2025-04-19' },
      { ...newRepeatEvent, id: '3', date: '2025-06-19' },
    ];

    expect(result.current.events).toEqual(expectedEvents);
  });

  it('반복 일정을 삭제하면 해당 일정만 삭제된다.', async () => {
    setupMockHandlerEventsListCreation();
    setupMockHandlerDeletion();

    const newRepeatEvent: Event = {
      id: '1',
      title: '새 회의',
      date: '2025-02-19',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 2, endDate: '2025-08-03' },
      notificationTime: 5,
    };

    const { result } = renderHook(() => useEventOperations(false));

    await act(async () => {
      await result.current.deleteEvent('1');
    });

    await act(() => Promise.resolve(null));

    const expectedEvents = [
      { ...newRepeatEvent, id: '2', date: '2025-04-19' },
      { ...newRepeatEvent, id: '3', date: '2025-06-19' },
    ];

    expect(result.current.events).toEqual([]);
  });
});
