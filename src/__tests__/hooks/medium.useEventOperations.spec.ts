import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerRepeatCreation,
  setupMockHandlerRepeatDeletion,
  setupMockHandlerRepeatUpdating,
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

describe('반복 일정 기능 테스트', () => {
  beforeEach(() => {
    // 각 테스트 전에 서버 핸들러를 리셋하고 토스트 함수 초기화
    server.resetHandlers();
    toastFn.mockClear();
  });

  it('일정 생성 시 반복 유형을 선택할 수 있다', async () => {
    setupMockHandlerRepeatCreation([
      {
        id: 'repeat-1',
        title: '반복 회의',
        date: '2025-10-16',
        startTime: '11:00',
        endTime: '12:00',
        description: '팀 정기 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1 },
        notificationTime: 10,
      },
    ]);

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const repeatEvent: Event = {
      id: '1',
      title: '반복 회의',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '팀 정기 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 1 },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.createRepeatEvents(repeatEvent);
    });

    expect(toastFn).toHaveBeenCalledWith({
      title: '반복 일정이 생성되었습니다.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  });

  it('각 반복 유형에 대해 간격을 설정할 수 있다', async () => {
    setupMockHandlerRepeatCreation([
      {
        id: 'repeat-2',
        title: '격주 회의',
        date: '2025-10-16',
        startTime: '11:00',
        endTime: '12:00',
        description: '격주 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 2 },
        notificationTime: 10,
      },
    ]);

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const intervalEvent: Event = {
      id: '2',
      title: '격주 회의',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '격주 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 2 },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.createRepeatEvents(intervalEvent);
    });

    expect(toastFn).toHaveBeenCalledWith({
      title: '반복 일정이 생성되었습니다.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  });

  it('반복 종료 조건을 지정할 수 있다', async () => {
    setupMockHandlerRepeatCreation([
      {
        id: 'repeat-3',
        title: '종료일 있는 회의',
        date: '2025-10-16',
        startTime: '11:00',
        endTime: '12:00',
        description: '특정 날짜까지 반복',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-12-31' },
        notificationTime: 10,
      },
    ]);

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const endDateEvent: Event = {
      id: '3',
      title: '종료일 있는 회의',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '특정 날짜까지 반복',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-12-31' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.createRepeatEvents(endDateEvent);
    });

    expect(toastFn).toHaveBeenCalledWith({
      title: '반복 일정이 생성되었습니다.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  });

  it('반복 일정이 생성되면 반복 일정 목록이 생성된다', async () => {
    setupMockHandlerRepeatCreation([
      {
        id: 'repeat-4-1',
        title: '반복 회의',
        date: '2025-10-16',
        startTime: '11:00',
        endTime: '12:00',
        description: '매주 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-11-30' },
        notificationTime: 10,
      },
      {
        id: 'repeat-4-2',
        title: '반복 회의',
        date: '2025-10-23',
        startTime: '11:00',
        endTime: '12:00',
        description: '매주 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-11-30' },
        notificationTime: 10,
      },
      {
        id: 'repeat-4-3',
        title: '반복 회의',
        date: '2025-10-30',
        startTime: '11:00',
        endTime: '12:00',
        description: '매주 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-11-30' },
        notificationTime: 10,
      },
    ]);

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const repeatEvent: Event = {
      id: '4',
      title: '반복 회의',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '매주 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-11-30' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.createRepeatEvents(repeatEvent);
    });

    expect(toastFn).toHaveBeenCalledWith({
      title: '반복 일정이 생성되었습니다.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    expect(result.current.events).toHaveLength(1);
  });

  it('반복 일정을 수정하면 단일 일정으로 변경된다', async () => {
    setupMockHandlerRepeatUpdating([
      {
        id: '5',
        title: '단일 회의', // 수정된 제목
        date: '2025-10-15',
        startTime: '11:00',
        endTime: '12:00',
        description: '팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ]);

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const repeatEvent: Event = {
      id: '5',
      title: '반복 회의',
      date: '2025-10-15',
      startTime: '11:00',
      endTime: '12:00',
      description: '팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 1 }, // 원래는 반복 일정
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.updateSingleOccurrence(repeatEvent);
    });

    expect(toastFn).toHaveBeenCalledWith({
      title: '일정이 단일 일정으로 변경되었습니다.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  });

  it('반복 일정을 삭제하면 해당 일정만 삭제된다', async () => {
    setupMockHandlerRepeatDeletion();

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    // 삭제할 반복 일정의 특정 회차 ID
    const eventIdToDelete = 'repeat-1';

    await act(async () => {
      await result.current.deleteSingleOccurrence(eventIdToDelete);
    });

    expect(toastFn).toHaveBeenCalledWith({
      title: '반복 일정의 해당 회차가 삭제되었습니다.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });

    expect(result.current.events).toHaveLength(1);
  });
});
