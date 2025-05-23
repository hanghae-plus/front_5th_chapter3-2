import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
  setupMockRepeatHandlerCreateion,
  setupMockRepeatHandlerDeletion,
  setupMockRepeatHandlerUpdation,
} from '../../__mocks__/handlersUtils.ts';
import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { server } from '../../setupTests.ts';
import { Event } from '../../types.ts';

const toastFn = vi.fn();

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react'); // 일부 모듈에 대해서만 모킹, 나머지는 기존 모듈의 기능을 그대로 사용
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

describe('에러 처리', () => {
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
});

describe('반복 일정', () => {
  describe('반복 유형 선택', () => {
    it('반복 유형을 "매일"로 선택하면 입력한 일정이 매일 반복된다.', async () => {
      setupMockRepeatHandlerCreateion();

      const { result } = renderHook(() => useEventOperations(false));

      await act(() => Promise.resolve(null));

      const newEvent: Event = {
        id: '1',
        title: '새 반복 일정',
        date: '2025-10-16',
        startTime: '11:00',
        endTime: '12:00',
        description: '새로운 반복 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-10-18' },
        notificationTime: 5,
      };

      await act(async () => {
        await result.current.saveRepeatEvent(newEvent);
      });

      expect(result.current.events).toHaveLength(3);
      expect(result.current.events[0]).toEqual(newEvent);
      expect(result.current.events[2]).toEqual({ ...newEvent, id: '3', date: '2025-10-18' });
    });

    it('반복 유형을 "매주"로 선택하면 입력한 일정이 매주 반복된다.', async () => {
      setupMockRepeatHandlerCreateion();

      const { result } = renderHook(() => useEventOperations(false));

      await act(() => Promise.resolve(null));

      const newEvent: Event = {
        id: '1',
        title: '새 반복 일정',
        date: '2025-10-01',
        startTime: '11:00',
        endTime: '12:00',
        description: '새로운 반복 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-10-18' },
        notificationTime: 5,
      };

      await act(async () => {
        await result.current.saveRepeatEvent(newEvent);
      });

      expect(result.current.events).toHaveLength(3);
      expect(result.current.events[0]).toEqual(newEvent);
      expect(result.current.events[1]).toEqual({ ...newEvent, id: '2', date: '2025-10-08' });
      expect(result.current.events[2]).toEqual({ ...newEvent, id: '3', date: '2025-10-15' });
    });

    it('반복 유형을 "매달"로 선택하면 입력한 일정이 매달 반복된다.', async () => {
      setupMockRepeatHandlerCreateion();

      const { result } = renderHook(() => useEventOperations(false));

      await act(() => Promise.resolve(null));

      const newEvent: Event = {
        id: '1',
        title: '새 반복 일정',
        date: '2025-05-01',
        startTime: '11:00',
        endTime: '12:00',
        description: '새로운 반복 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-08-18' },
        notificationTime: 5,
      };

      await act(async () => {
        await result.current.saveRepeatEvent(newEvent);
      });

      expect(result.current.events).toHaveLength(4);
      expect(result.current.events[0]).toEqual(newEvent);
      expect(result.current.events[1]).toEqual({ ...newEvent, id: '2', date: '2025-06-01' });
      expect(result.current.events[3]).toEqual({ ...newEvent, id: '4', date: '2025-08-01' });
    });

    it('윤년 29일에 반복 일정 설정하면 윤년 29일에만 표시를 한다.', async () => {
      setupMockRepeatHandlerCreateion();

      const { result } = renderHook(() => useEventOperations(false));

      await act(() => Promise.resolve(null));

      const newEvent: Event = {
        id: '1',
        title: '새 반복 일정',
        date: '2024-02-29',
        startTime: '11:00',
        endTime: '12:00',
        description: '새로운 반복 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 1, endDate: '2029-10-18' },
        notificationTime: 5,
      };

      await act(async () => {
        await result.current.saveRepeatEvent(newEvent);
      });

      expect(result.current.events[0].date).toBe('2024-02-29');
      expect(result.current.events[1].date).toBe('2028-02-29');
    });

    it('매월 반복 일정을 31일로 설정한다면, 31일이 없는 달은 표시하지 않는다.', async () => {
      setupMockRepeatHandlerCreateion();

      const { result } = renderHook(() => useEventOperations(false));

      await act(() => Promise.resolve(null));

      const newEvent: Event = {
        id: '1',
        title: '새 반복 일정',
        date: '2025-05-31',
        startTime: '11:00',
        endTime: '12:00',
        description: '새로운 반복 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-7-31' },
        notificationTime: 5,
      };

      await act(async () => {
        await result.current.saveRepeatEvent(newEvent);
      });

      expect(result.current.events).toHaveLength(2);
      expect(result.current.events[0].date).toBe('2025-05-31');
      expect(result.current.events[1].date).toBe('2025-07-31');
    });
  });

  describe('반복 간격 설정', () => {
    it('매일 반복되는 일정에 대해 간격을 2일로 설정할 수 있다.', async () => {
      setupMockRepeatHandlerCreateion();

      const { result } = renderHook(() => useEventOperations(false));

      await act(() => Promise.resolve(null));

      const newEvent: Event = {
        id: '1',
        title: '새 반복 일정',
        date: '2025-10-14',
        startTime: '11:00',
        endTime: '12:00',
        description: '새로운 반복 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 2, endDate: '2025-10-18' },
        notificationTime: 5,
      };

      await act(async () => {
        await result.current.saveRepeatEvent(newEvent);
      });

      expect(result.current.events[0].date).toBe('2025-10-14');
      expect(result.current.events[1].date).toBe('2025-10-16');
    });

    it('매주 반복되는 일정에 대해 간격을 3주로 설정할 수 있다.', async () => {
      setupMockRepeatHandlerCreateion();

      const { result } = renderHook(() => useEventOperations(false));

      await act(() => Promise.resolve(null));

      const newEvent: Event = {
        id: '1',
        title: '새 반복 일정',
        date: '2025-10-01',
        startTime: '11:00',
        endTime: '12:00',
        description: '새로운 반복 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 2, endDate: '2025-10-18' },
        notificationTime: 5,
      };

      await act(async () => {
        await result.current.saveRepeatEvent(newEvent);
      });

      expect(result.current.events[0].date).toBe('2025-10-01');
      expect(result.current.events[1].date).toBe('2025-10-15');
    });

    it('매월 반복되는 일정에 대해 간격을 3개월로 설정할 수 있다.', async () => {
      setupMockRepeatHandlerCreateion();

      const { result } = renderHook(() => useEventOperations(false));

      await act(() => Promise.resolve(null));

      const newEvent: Event = {
        id: '1',
        title: '새 반복 일정',
        date: '2025-05-01',
        startTime: '11:00',
        endTime: '12:00',
        description: '새로운 반복 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 3, endDate: '2025-10-18' },
        notificationTime: 5,
      };

      await act(async () => {
        await result.current.saveRepeatEvent(newEvent);
      });

      expect(result.current.events[0].date).toBe('2025-05-01');
      expect(result.current.events[1].date).toBe('2025-08-01');
    });
  });

  it('반복 종료 조건을 "2025-05-03"로 지정하면, 지정한 날짜 이후 일정이 반복되지 않는다.', async () => {
    setupMockRepeatHandlerCreateion();

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      id: '1',
      title: '새 반복 일정',
      date: '2025-05-01',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 반복 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-05-03' },
      notificationTime: 5,
    };

    await act(async () => {
      await result.current.saveRepeatEvent(newEvent);
    });
    expect(result.current.events[0].date).toBe('2025-05-01');
    expect(result.current.events[2].date).toBe('2025-05-03');
    expect(result.current.events.every((e) => e.date !== '2025-05-04')).toBe(true);
  });

  it('반복 일정을 수정하면 단일 일정으로 변경된다.', async () => {
    setupMockRepeatHandlerUpdation();

    const { result } = renderHook(() => useEventOperations(true));

    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      id: '1',
      title: '새 반복 일정',
      date: '2025-05-01',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 반복 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-05-03' },
      notificationTime: 5,
    };

    await act(async () => {
      await result.current.saveRepeatEvent(newEvent);
    });

    expect(result.current.events[0]).toEqual(newEvent);
  });

  it('반복 일정 중 특정 일정을 삭제하면, 해당 일정만 삭제한다.', async () => {
    setupMockRepeatHandlerDeletion();

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newEvent: Event = {
      id: '1',
      title: '새 반복 일정',
      date: '2025-05-01',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 반복 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-05-03' },
      notificationTime: 5,
    };
    expect(result.current.events.length).toBe(7);

    await act(async () => {
      await result.current.deleteRepeatEvent([newEvent.id]);
    });

    expect(result.current.events.length).toBe(6);
  });
});
