import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
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

describe('반복 유형 선택', () => {
  it('일정 생성시 반복 유형을 매일로 선택할 수 있다.', async () => {
    setupMockHandlerCreation();

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      id: '1',
      title: '매일 반복',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '매일 반복 테스트',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
      notificationTime: 1,
    };

    await act(async () => {
      await result.current.saveRepeatEvents(newEvent);
    });

    expect(result.current.events).toHaveLength(2);
    expect(result.current.events[0].repeat.type).toBe('daily');
    expect(result.current.events[0].repeat.interval).toBe(1);
  });

  it('일정 수정시 반복 유형을 매주로 선택할 수 있다.', async () => {
    setupMockHandlerUpdating();

    const { result } = renderHook(() => useEventOperations(true));

    await act(() => Promise.resolve(null));

    const updatedEvent: Event = {
      id: '2',
      title: '매주 반복',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '매주 반복 테스트',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-10-31' },
      notificationTime: 1,
    };

    await act(async () => {
      await result.current.saveEvent(updatedEvent);
    });

    expect(result.current.events[result.current.events.length - 1].repeat.type).toBe('none');
    expect(result.current.events[result.current.events.length - 1].repeat.interval).toBe(1);
  });

  it('반복 유형이 매월이고 윤년 2024년 2월 29일에 반복 일정을 선택했을 때, 2025년 3월 01일에 반복 일정이 생성된다.', async () => {
    setupMockHandlerCreation();

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      id: '1',
      title: '새 회의',
      date: '2024-02-29',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 6, endDate: '2025-03-01' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatEvents(newEvent);
    });

    expect(result.current.events).toHaveLength(3);
    expect(result.current.events[0].date).toBe('2024-02-29');
    expect(result.current.events[1].date).toBe('2024-08-29');
    expect(result.current.events[2].date).toBe('2025-03-01');
  });

  it('반복 유형이 매년이고 윤년 2024년 2월 29일에 반복 일정을 선택했을 때, 2025년 3월 01일에 반복 일정이 생성된다.', async () => {
    setupMockHandlerCreation();

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      id: '1',
      title: '새 회의',
      date: '2024-02-29',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'yearly', interval: 1, endDate: '2025-03-01' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatEvents(newEvent);
    });

    expect(result.current.events).toHaveLength(2);
    expect(result.current.events[0].date).toBe('2024-02-29');
    expect(result.current.events[1].date).toBe('2025-03-01');
  });
});

describe('반복 간격 설정', () => {
  it('일정 반복 유형을 daily로 설정시 interval 간격만큼 반복 일간 정보가 반영된다.', async () => {
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
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-20' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatEvents(newEvent);
    });

    expect(result.current.events).toHaveLength(5);
  });

  it('일정 반복 유형을 weekly로 설정시 interval 간격만큼 반복 주간 정보가 반영된다.', async () => {
    setupMockHandlerCreation();

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      id: '1',
      title: '새 회의',
      date: '2025-10-01',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-10-30' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatEvents(newEvent);
    });

    const expectedDate = ['2025-10-01', '2025-10-08', '2025-10-15', '2025-10-22', '2025-10-29'];

    expect(result.current.events).toHaveLength(5);
    expectedDate.forEach((date, index) => {
      expect(result.current.events[index].date).toBe(date);
    });
  });

  it('일정 반복 유형을 monthly로 설정시 interval 간격만큼 반복 월간 정보가 반영된다.', async () => {
    setupMockHandlerCreation();

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      id: '1',
      title: '새 회의',
      date: '2025-10-01',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-12-30' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatEvents(newEvent);
    });

    const expectedDate = ['2025-10-01', '2025-11-01', '2025-12-01'];

    expect(result.current.events).toHaveLength(3);
    expectedDate.forEach((date, index) => {
      expect(result.current.events[index].date).toBe(date);
    });
  });

  it('일정 반복 유형을 yearly로 설정시 interval 간격만큼 반복 년간 정보가 반영된다.', async () => {
    setupMockHandlerCreation();

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      id: '1',
      title: '새 회의',
      date: '2025-10-01',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'yearly', interval: 1, endDate: '2026-10-30' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveRepeatEvents(newEvent);
    });

    const expectedDate = ['2025-10-01', '2026-10-01'];

    expect(result.current.events).toHaveLength(2);
    expectedDate.forEach((date, index) => {
      expect(result.current.events[index].date).toBe(date);
    });
  });
});
