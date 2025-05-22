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

describe('반복 일정 기능', () => {
  it('반복 일정을 생성할 수 있다', async () => {
    setupMockHandlerCreation();

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const repeatEvent: Event = {
      id: '1',
      title: '반복 회의',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '매일 반복되는 회의',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-10-03',
      },
      notificationTime: 30,
    };

    await act(async () => {
      await result.current.saveEvent(repeatEvent);
    });

    expect(result.current.events).toHaveLength(3);
    expect(result.current.events[0].date).toBe('2025-10-01');
    expect(result.current.events[1].date).toBe('2025-10-02');
    expect(result.current.events[2].date).toBe('2025-10-03');
  });

  it('반복 일정을 수정할 수 있다', async () => {
    setupMockHandlerUpdating();

    const { result } = renderHook(() => useEventOperations(true));

    await act(() => Promise.resolve(null));

    const updatedRepeatEvent: Event = {
      id: '1',
      title: '수정된 반복 회의',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '수정된 반복 회의',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-10-03',
      },
      notificationTime: 30,
    };

    await act(async () => {
      await result.current.saveEvent(updatedRepeatEvent);
    });

    expect(result.current.events[0].title).toBe('수정된 반복 회의');
  });

  it('반복 일정을 삭제할 수 있다', async () => {
    setupMockHandlerDeletion();

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    await act(async () => {
      await result.current.deleteEvent('1');
    });

    expect(result.current.events).toHaveLength(0);
  });

  it('반복 간격이 0이하인 경우 에러를 발생시킨다', async () => {
    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const invalidRepeatEvent: Event = {
      id: '1',
      title: '잘못된 반복 회의',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '잘못된 반복 회의',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 0,
        endDate: '2025-10-03',
      },
      notificationTime: 30,
    };

    await act(async () => {
      await result.current.saveEvent(invalidRepeatEvent);
    });

    expect(toastFn).toHaveBeenCalledWith({
      duration: 3000,
      isClosable: true,
      title: '일정 저장 실패',
      status: 'error',
    });
  });

  describe('반복 유형 선택', () => {
    it('매일 반복 일정을 생성할 수 있다', async () => {
      setupMockHandlerCreation();

      const { result } = renderHook(() => useEventOperations(false));

      await act(() => Promise.resolve(null));

      const dailyEvent: Event = {
        id: '1',
        title: '매일 회의',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '매일 반복되는 회의',
        location: '회의실 A',
        category: '업무',
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: '2025-10-03',
        },
        notificationTime: 30,
      };

      await act(async () => {
        await result.current.saveEvent(dailyEvent);
      });

      expect(result.current.events).toHaveLength(3);
      expect(result.current.events[0].date).toBe('2025-10-01');
      expect(result.current.events[1].date).toBe('2025-10-02');
      expect(result.current.events[2].date).toBe('2025-10-03');
    });

    it('매주 반복 일정을 생성할 수 있다', async () => {
      setupMockHandlerCreation();

      const { result } = renderHook(() => useEventOperations(false));

      await act(() => Promise.resolve(null));

      const weeklyEvent: Event = {
        id: '1',
        title: '주간 회의',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '매주 반복되는 회의',
        location: '회의실 A',
        category: '업무',
        repeat: {
          type: 'weekly',
          interval: 1,
          endDate: '2025-10-15',
        },
        notificationTime: 30,
      };

      await act(async () => {
        await result.current.saveEvent(weeklyEvent);
      });

      expect(result.current.events).toHaveLength(3);
      expect(result.current.events[0].date).toBe('2025-10-01');
      expect(result.current.events[1].date).toBe('2025-10-08');
      expect(result.current.events[2].date).toBe('2025-10-15');
    });

    it('매월 반복 일정을 생성할 수 있다', async () => {
      setupMockHandlerCreation();

      const { result } = renderHook(() => useEventOperations(false));

      await act(() => Promise.resolve(null));

      const monthlyEvent: Event = {
        id: '1',
        title: '월간 회의',
        date: '2025-01-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '매월 반복되는 회의',
        location: '회의실 A',
        category: '업무',
        repeat: {
          type: 'monthly',
          interval: 1,
          endDate: '2025-03-31',
        },
        notificationTime: 30,
      };

      await act(async () => {
        await result.current.saveEvent(monthlyEvent);
      });

      expect(result.current.events).toHaveLength(3);
      expect(result.current.events[0].date).toBe('2025-01-31');
      expect(result.current.events[1].date).toBe('2025-02-28'); // 2월은 28일까지만
      expect(result.current.events[2].date).toBe('2025-03-31');
    });

    it('매년 반복 일정을 생성할 수 있다', async () => {
      setupMockHandlerCreation();

      const { result } = renderHook(() => useEventOperations(false));

      await act(() => Promise.resolve(null));

      const yearlyEvent: Event = {
        id: '1',
        title: '연간 회의',
        date: '2024-02-29',
        startTime: '09:00',
        endTime: '10:00',
        description: '매년 반복되는 회의',
        location: '회의실 A',
        category: '업무',
        repeat: {
          type: 'yearly',
          interval: 1,
          endDate: '2026-02-28',
        },
        notificationTime: 30,
      };

      await act(async () => {
        await result.current.saveEvent(yearlyEvent);
      });

      expect(result.current.events).toHaveLength(3);
      expect(result.current.events[0].date).toBe('2024-02-29'); // 윤년
      expect(result.current.events[1].date).toBe('2025-02-28'); // 평년
      expect(result.current.events[2].date).toBe('2026-02-28'); // 평년
    });

    it('반복 유형이 없는 경우 단일 일정만 생성된다', async () => {
      setupMockHandlerCreation();

      const { result } = renderHook(() => useEventOperations(false));

      await act(() => Promise.resolve(null));

      const singleEvent: Event = {
        id: '1',
        title: '단일 회의',
        date: '2025-10-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '단일 회의',
        location: '회의실 A',
        category: '업무',
        repeat: {
          type: 'none',
          interval: 0,
        },
        notificationTime: 30,
      };

      await act(async () => {
        await result.current.saveEvent(singleEvent);
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0].date).toBe('2025-10-01');
    });
  });
});
