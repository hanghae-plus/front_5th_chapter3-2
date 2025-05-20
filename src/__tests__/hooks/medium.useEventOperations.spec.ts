import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../../__mocks__/handlersUtils.ts';
import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { useRepeatEvents } from '../../hooks/useRepeatEvents.ts';
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

describe('useRepeatEvents', () => {
  describe('반복 유형 선택 테스트', () => {
    it('반복 유형을 매일로 설정하면 해당 간격으로 일정이 생성된다', async () => {
      const { result } = renderHook(() => useRepeatEvents());

      const baseEvent: Event = {
        id: '1',
        title: '매일 회의',
        date: '2025-05-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '매일 스크럼 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: '2025-05-07',
        },
        notificationTime: 10,
      };

      await act(async () => {
        await result.current.createRepeatEvents(baseEvent);
      });

      // 시작일부터 종료일까지 총 7개의 일정이 생성되어야 함
      const events = result.current.getRepeatEvents(baseEvent.repeat.id);
      expect(events).toHaveLength(7);

      // 생성된 일정의 날짜가 연속적으로 증가하는지 확인
      expect(events[0].date).toBe('2025-05-01');
      expect(events[1].date).toBe('2025-05-02');
      expect(events[6].date).toBe('2025-05-07');

      // 모든 일정이 같은 반복 ID를 가지는지 확인
      expect(events.every((event) => event.repeat.id === baseEvent.repeat.id)).toBe(true);
    });

    it('반복 유형을 매주로 설정하면 해당 간격으로 일정이 생성된다', async () => {
      const { result } = renderHook(() => useRepeatEvents());

      const baseEvent: Event = {
        id: '2',
        title: '주간 회의',
        date: '2025-05-01',
        startTime: '14:00',
        endTime: '15:00',
        description: '주간 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: {
          type: 'weekly',
          interval: 1,
          endDate: '2025-05-29',
        },
        notificationTime: 10,
      };

      await act(async () => {
        await result.current.createRepeatEvents(baseEvent);
      });

      // 5/1, 5/8, 5/15, 5/22, 5/29 총 5개의 일정이 생성되어야 함
      const events = result.current.getRepeatEvents(baseEvent.repeat.id);
      expect(events).toHaveLength(5);

      // 생성된 일정의 날짜가 7일씩 증가하는지 확인
      expect(events[0].date).toBe('2025-05-01');
      expect(events[1].date).toBe('2025-05-08');
      expect(events[4].date).toBe('2025-05-29');
    });

    it('반복 유형을 매월로 설정하면 해당 간격으로 일정이 생성된다', async () => {
      const { result } = renderHook(() => useRepeatEvents());

      const baseEvent: Event = {
        id: '3',
        title: '월간 보고',
        date: '2025-05-15',
        startTime: '10:00',
        endTime: '11:00',
        description: '월간 실적 보고',
        location: '회의실 C',
        category: '업무',
        repeat: {
          type: 'monthly',
          interval: 1,
          endDate: '2025-08-15',
        },
        notificationTime: 10,
      };

      await act(async () => {
        await result.current.createRepeatEvents(baseEvent);
      });

      // 5/15, 6/15, 7/15, 8/15 총 4개의 일정이 생성되어야 함
      const events = result.current.getRepeatEvents(baseEvent.repeat.id);
      expect(events).toHaveLength(4);

      // 생성된 일정의 날짜가 한 달씩 증가하는지 확인
      expect(events[0].date).toBe('2025-05-15');
      expect(events[1].date).toBe('2025-06-15');
      expect(events[3].date).toBe('2025-08-15');
    });

    it('반복 유형을 매년으로 설정하면 해당 간격으로 일정이 생성된다', async () => {
      const { result } = renderHook(() => useRepeatEvents());

      const baseEvent: Event = {
        id: '4',
        title: '연간 계획 회의',
        date: '2025-01-10',
        startTime: '10:00',
        endTime: '11:00',
        description: '연간 사업 계획 회의',
        location: '회의실 D',
        category: '업무',
        repeat: {
          type: 'yearly',
          interval: 1,
          endDate: '2027-01-10',
        },
        notificationTime: 10,
      };

      await act(async () => {
        await result.current.createRepeatEvents(baseEvent);
      });

      // 2025/1/10, 2026/1/10, 2027/1/10 총 3개의 일정이 생성되어야 함
      const events = result.current.getRepeatEvents(baseEvent.repeat.id);
      expect(events).toHaveLength(3);

      // 생성된 일정의 날짜가 1년씩 증가하는지 확인
      expect(events[0].date).toBe('2025-01-10');
      expect(events[1].date).toBe('2026-01-10');
      expect(events[2].date).toBe('2027-01-10');
    });

    it('윤년이나 존재하지 않는 날짜(예: 2월 30일)의 경우 적절히 조정된다', async () => {
      const { result } = renderHook(() => useRepeatEvents());

      // 2월 29일 윤년 테스트 (2024년은 윤년)
      const leapYearEvent: Event = {
        id: '5',
        title: '윤년 테스트',
        date: '2024-02-29',
        startTime: '10:00',
        endTime: '11:00',
        description: '윤년 테스트',
        location: '회의실',
        category: '테스트',
        repeat: {
          type: 'yearly',
          interval: 1,
          endDate: '2027-02-28',
        },
        notificationTime: 10,
      };

      await act(async () => {
        await result.current.createRepeatEvents(leapYearEvent);
      });

      const leapYearEvents = result.current.getRepeatEvents(leapYearEvent.repeat.id);
      // 2024-02-29, 2025-02-28, 2026-02-28, 2027-02-28
      expect(leapYearEvents).toHaveLength(4);
      expect(leapYearEvents[0].date).toBe('2024-02-29');
      expect(leapYearEvents[1].date).toBe('2025-02-28'); // 2025년에는 2월 29일이 없으므로 2월 28일로 조정
      expect(leapYearEvents[3].date).toBe('2027-02-28');

      // 존재하지 않는 날짜 테스트 (4월 31일)
      const nonExistingDateEvent: Event = {
        id: '6',
        title: '존재하지 않는 날짜 테스트',
        date: '2025-01-31',
        startTime: '10:00',
        endTime: '11:00',
        description: '존재하지 않는 날짜 테스트',
        location: '회의실',
        category: '테스트',
        repeat: {
          type: 'monthly',
          interval: 1,
          endDate: '2025-04-30',
        },
        notificationTime: 10,
      };

      await act(async () => {
        await result.current.createRepeatEvents(nonExistingDateEvent);
      });

      const nonExistingDateEvents = result.current.getRepeatEvents(nonExistingDateEvent.repeat.id);
      // 1/31, 2/28, 3/31, 4/30
      expect(nonExistingDateEvents).toHaveLength(4);
      expect(nonExistingDateEvents[0].date).toBe('2025-01-31');
      expect(nonExistingDateEvents[1].date).toBe('2025-02-28'); // 2월 31일이 없으므로 2월 28일로 조정
      expect(nonExistingDateEvents[2].date).toBe('2025-03-31');
      expect(nonExistingDateEvents[3].date).toBe('2025-04-30');
    });
  });
});
