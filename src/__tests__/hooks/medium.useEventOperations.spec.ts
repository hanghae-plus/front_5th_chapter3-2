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
import { isRecurringEvent, getRecurringEventIcon } from '../../utils/eventUtils.ts';

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
  it('일정 생성 시 반복 유형을 선택할 수 있다', async () => {
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

  it('반복 일정은 시각적으로 구분할 수 있는 표시 함수가 있다', async () => {
    // 각 반복 유형별 이벤트 생성
    const dailyEvent: Event = {
      id: 'daily-event',
      title: '매일 반복',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '매일 반복 테스트',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1 },
      notificationTime: 10,
    };

    const weeklyEvent: Event = {
      id: 'weekly-event',
      title: '매주 반복',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '매주 반복 테스트',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 1 },
      notificationTime: 10,
    };

    const monthlyEvent: Event = {
      id: 'monthly-event',
      title: '매월 반복',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '매월 반복 테스트',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1 },
      notificationTime: 10,
    };

    const yearlyEvent: Event = {
      id: 'yearly-event',
      title: '매년 반복',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '매년 반복 테스트',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'yearly', interval: 1 },
      notificationTime: 10,
    };

    // 일반 이벤트 (반복 없음)
    const regularEvent: Event = {
      id: 'regular-event',
      title: '일반 회의',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '일반 테스트',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };

    // isRecurringEvent 함수 테스트 - 반복 이벤트 여부 확인
    expect(isRecurringEvent(dailyEvent)).toBe(true);
    expect(isRecurringEvent(weeklyEvent)).toBe(true);
    expect(isRecurringEvent(monthlyEvent)).toBe(true);
    expect(isRecurringEvent(yearlyEvent)).toBe(true);
    expect(isRecurringEvent(regularEvent)).toBe(false);

    // getRecurringEventIcon 함수 테스트 - 각 반복 유형별 아이콘 확인
    expect(getRecurringEventIcon(dailyEvent)).toBe('🔄 매일');
    expect(getRecurringEventIcon(weeklyEvent)).toBe('🔄 매주');
    expect(getRecurringEventIcon(monthlyEvent)).toBe('🔄 매월');
    expect(getRecurringEventIcon(yearlyEvent)).toBe('🔄 매년');
    expect(getRecurringEventIcon(regularEvent)).toBeNull();

    // 간격이 다른 반복 이벤트도 올바르게 인식하는지 테스트
    const biWeeklyEvent: Event = {
      id: 'bi-weekly-event',
      title: '격주 반복',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '격주 반복 테스트',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 2 }, // 2주마다
      notificationTime: 10,
    };

    const quarterlyEvent: Event = {
      id: 'quarterly-event',
      title: '분기별 반복',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '분기별 반복 테스트',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 3 }, // 3개월마다
      notificationTime: 10,
    };

    // 간격과 상관없이 반복 유형에 따라 올바르게 구분되는지 확인
    expect(isRecurringEvent(biWeeklyEvent)).toBe(true);
    expect(isRecurringEvent(quarterlyEvent)).toBe(true);

    // 간격과 상관없이 반복 유형에 따라 올바른 아이콘이 반환되는지 확인
    expect(getRecurringEventIcon(biWeeklyEvent)).toBe('🔄 매주'); // interval과 상관없이 weekly
    expect(getRecurringEventIcon(quarterlyEvent)).toBe('🔄 매월'); // interval과 상관없이 monthly

    // endDate가 있는 반복 이벤트도 올바르게 인식하는지 테스트
    const limitedRepeatEvent: Event = {
      id: 'limited-repeat-event',
      title: '기간 제한 반복',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '기간 제한 반복 테스트',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-12-31' },
      notificationTime: 10,
    };

    expect(isRecurringEvent(limitedRepeatEvent)).toBe(true);
    expect(getRecurringEventIcon(limitedRepeatEvent)).toBe('🔄 매일');
  });

  it('각 반복 유형에 대해 간격을 설정할 수 있다', async () => {
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
