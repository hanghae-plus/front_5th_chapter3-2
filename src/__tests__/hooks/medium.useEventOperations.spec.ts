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
    await result.current.saveEvent(newEvent, null);
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
    await result.current.saveEvent(updatedEvent, null);
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
    await result.current.saveEvent(nonExistentEvent, null);
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

// 반복 이벤트 관련 목 핸들러 설정
const setupMockHandlerForRecurringEvents = () => {
  server.use(
    // 반복 이벤트 생성
    http.post('/api/events-list', () => {
      return HttpResponse.json([
        {
          id: '2',
          title: '반복 회의',
          date: '2025-10-15',
          startTime: '14:00',
          endTime: '15:00',
          description: '주간 팀 미팅',
          location: '회의실 A',
          category: '업무',
          repeat: {
            type: 'weekly',
            interval: 1,
            id: 'repeat-123',
            exceptions: [],
          },
          notificationTime: 10,
        },
      ]);
    }),

    // 원본 이벤트 업데이트
    http.put('/api/events/:id', ({ params }) => {
      const id = params.id;
      return HttpResponse.json({
        id,
        title: '반복 회의',
        date: '2025-10-15',
        startTime: '14:00',
        endTime: '15:00',
        description: '주간 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: {
          type: 'weekly',
          interval: 1,
          id: 'repeat-123',
          exceptions: ['2025-10-22'], // 예외가 추가됨
        },
        notificationTime: 10,
      });
    }),

    // 특정 인스턴스 수정에 대한 새 단일 이벤트 생성
    http.post('/api/events', () => {
      return HttpResponse.json({
        id: '3',
        title: '수정된 반복 회의',
        date: '2025-10-22',
        startTime: '16:00', // 변경됨
        endTime: '17:00', // 변경됨
        description: '주간 팀 미팅 - 수정됨',
        location: '회의실 C', // 변경됨
        category: '업무',
        repeat: { type: 'none', interval: 1 },
        notificationTime: 10,
      });
    }),

    // 이벤트 조회
    http.get('/api/events', () => {
      return HttpResponse.json({
        events: [
          {
            id: '2',
            title: '반복 회의',
            date: '2025-10-15',
            startTime: '14:00',
            endTime: '15:00',
            description: '주간 팀 미팅',
            location: '회의실 A',
            category: '업무',
            repeat: {
              type: 'weekly',
              interval: 1,
              id: 'repeat-123',
              exceptions: ['2025-10-22'],
            },
            notificationTime: 10,
          },
          {
            id: '3',
            title: '수정된 반복 회의',
            date: '2025-10-22',
            startTime: '16:00',
            endTime: '17:00',
            description: '주간 팀 미팅 - 수정됨',
            location: '회의실 C',
            category: '업무',
            repeat: { type: 'none', interval: 1 },
            notificationTime: 10,
          },
        ],
      });
    })
  );
};

// 테스트 케이스 추가
it('반복 일정을 생성하면 적절하게 저장된다', async () => {
  setupMockHandlerForRecurringEvents();

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  const newRecurringEvent = {
    title: '반복 회의',
    date: '2025-10-15',
    startTime: '14:00',
    endTime: '15:00',
    description: '주간 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: {
      type: 'weekly',
      interval: 1,
    },
    notificationTime: 10,
  } satisfies EventForm;

  await act(async () => {
    await result.current.saveEvent(newRecurringEvent, null);
  });

  // 저장 후 이벤트 목록에 추가되었는지 확인
  expect(result.current.events).toHaveLength(2);
  expect(
    result.current.events.some(
      (event) => event.title === '반복 회의' && event.repeat.type === 'weekly'
    )
  ).toBe(true);

  // 성공 토스트 메시지 확인
  expect(toastFn).toHaveBeenCalledWith({
    title: '일정이 추가되었습니다.',
    status: 'success',
    duration: 3000,
    isClosable: true,
  });
});

it('반복 일정의 특정 인스턴스를 수정하면 원본에 예외가 추가되고 새 단일 이벤트가 생성된다', async () => {
  setupMockHandlerForRecurringEvents();

  const { result } = renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  // 원본 반복 이벤트에서 특정 날짜의 인스턴스
  const virtualInstance = {
    id: '2',
    title: '반복 회의',
    date: '2025-10-22', // 수정할 특정 날짜
    startTime: '14:00',
    endTime: '15:00',
    description: '주간 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: {
      type: 'weekly',
      interval: 1,
      id: 'repeat-123',
      exceptions: [],
    },
    notificationTime: 10,
  } satisfies Event;

  // 수정할 내용
  const changes = {
    title: '수정된 반복 회의',
    startTime: '16:00',
    endTime: '17:00',
    description: '주간 팀 미팅 - 수정됨',
    location: '회의실 C',
  };

  await act(async () => {
    await result.current.updateRepeatedEvent(changes, virtualInstance);
  });

  // 결과 확인
  expect(result.current.events).toHaveLength(2);

  // 원본 이벤트에 예외가 추가되었는지 확인
  const originalEvent = result.current.events.find((e) => e.id === '2');
  expect(originalEvent?.repeat.exceptions).toContain('2025-10-22');

  // 새 단일 이벤트가 생성되었는지 확인
  const newSingleEvent = result.current.events.find((e) => e.id === '3');
  expect(newSingleEvent).toBeDefined();
  expect(newSingleEvent?.title).toBe('수정된 반복 회의');
  expect(newSingleEvent?.startTime).toBe('16:00');
  expect(newSingleEvent?.endTime).toBe('17:00');
  expect(newSingleEvent?.location).toBe('회의실 C');
  expect(newSingleEvent?.repeat.type).toBe('none');
});

it('반복 일정의 특정 인스턴스를 삭제하면 원본에 예외가 추가된다', async () => {
  setupMockHandlerForRecurringEvents();

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  // 삭제할 반복 이벤트 인스턴스
  const instanceToDelete = {
    id: '2',
    title: '반복 회의',
    date: '2025-10-22', // 삭제할 특정 날짜
    startTime: '14:00',
    endTime: '15:00',
    description: '주간 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: {
      type: 'weekly',
      interval: 1,
      id: 'repeat-123',
      exceptions: [],
    },
    notificationTime: 10,
  } satisfies Event;

  await act(async () => {
    await result.current.deleteRepeatedEvent(instanceToDelete);
  });

  // 원본 이벤트에 예외가 추가되었는지 확인
  const originalEvent = result.current.events.find((e) => e.id === '2');
  expect(originalEvent?.repeat.exceptions).toContain('2025-10-22');

  // 성공 토스트 메시지 확인
  expect(toastFn).toHaveBeenCalledWith({
    title: '반복 일정이 삭제되었습니다.',
    status: 'info',
    duration: 3000,
    isClosable: true,
  });
});

it('반복 일정 수정 시 원본 이벤트를 찾지 못하면 에러가 발생한다', async () => {
  // 원본 이벤트를 찾을 수 없도록 설정
  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({
        events: [], // 빈 이벤트 목록
      });
    })
  );

  const { result } = renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  // 존재하지 않는 원본을 참조하는 가상 인스턴스
  const nonExistentInstance = {
    id: 'non-existent',
    title: '존재하지 않는 회의',
    date: '2025-10-22',
    startTime: '14:00',
    endTime: '15:00',
    description: '주간 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: {
      type: 'weekly',
      interval: 1,
      id: 'non-existent-repeat',
      exceptions: [],
    },
    notificationTime: 10,
  } satisfies Event;

  await act(async () => {
    try {
      await result.current.updateRepeatedEvent({ title: '수정된 제목' }, nonExistentInstance);
    } catch (error) {
      // 에러가 발생하는지 확인
      expect((error as Error).message).toBe('원본 이벤트를 찾을 수 없습니다.');
    }
  });
});
