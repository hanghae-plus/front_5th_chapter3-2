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
      repeat: { type: 'none', interval: 0, endType: 'date' },
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
    repeat: { type: 'none', interval: 0, endType: 'date' },
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
    repeat: { type: 'none', interval: 0, endType: 'date' },
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
    repeat: { type: 'none', interval: 0, endType: 'date' },
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
describe('반복 일정 테스트', () => {
  const createEvent = (override: Partial<EventForm>): EventForm => ({
    title: '반복 일정 테스트',
    date: '2025-05-01',
    startTime: '10:00',
    endTime: '11:00',
    description: '',
    location: '',
    category: '',
    notificationTime: 0,
    repeat: { type: 'none', interval: 0, endType: 'date' },
    ...override,
  });

  it('반복 유형 선택 시 매일 설정된 간격만큼 이벤트가 생성된다', async () => {
    setupMockHandlerCreation();
    const { result } = renderHook(() => useEventOperations(false));
    const event = createEvent({
      repeat: { type: 'daily', interval: 1, endType: 'date', endDate: '2025-05-03' },
    });
    await act(async () => await result.current.saveEvent(event));

    expect(result.current.events).toEqual([
      { ...event, id: '1', date: '2025-05-01' },
      { ...event, id: '2', date: '2025-05-02' },
      { ...event, id: '3', date: '2025-05-03' },
    ]);
  });

  it('반복 간격 설정 시 간격이 적용되어 생성된다 (격일)', async () => {
    setupMockHandlerCreation();
    const { result } = renderHook(() => useEventOperations(false));
    const event = createEvent({
      repeat: { type: 'daily', interval: 2, endType: 'date', endDate: '2025-05-05' },
    });
    await act(async () => await result.current.saveEvent(event));

    expect(result.current.events).toEqual([
      { ...event, id: '1', date: '2025-05-01' },
      { ...event, id: '2', date: '2025-05-03' },
      { ...event, id: '3', date: '2025-05-05' },
    ]);
  });

  it('종료일이 지정되지 않은 경우 시스템 종료일인 2025-09-30까지만 생성된다', async () => {
    setupMockHandlerCreation();
    const { result } = renderHook(() => useEventOperations(false));
    const event = createEvent({
      repeat: { type: 'monthly', interval: 1, endType: 'date' },
    });
    await act(async () => await result.current.saveEvent(event));

    expect(result.current.events).toEqual([
      { ...event, id: '1', date: '2025-05-01' },
      { ...event, id: '2', date: '2025-06-01' },
      { ...event, id: '3', date: '2025-07-01' },
      { ...event, id: '4', date: '2025-08-01' },
      { ...event, id: '5', date: '2025-09-01' },
    ]);

    // 10월 이후의 날짜가 생성되지 않음을 검증
    const octoberEvent = result.current.events.find((event) => event.date === '2025-10-01');
    expect(octoberEvent).toBeUndefined();
  });

  it('반복 일정의 특정 인스턴스를 수정하면 단일 일정이 되며 repeat.type이 none으로 설정된다', async () => {
    setupMockHandlerUpdating();
    const { result } = renderHook(() => useEventOperations(true));
    const event: Event = {
      id: 'e-mod',
      title: '원본 일정',
      date: '2025-05-10',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '',
      notificationTime: 0,
      repeat: { type: 'daily', interval: 1, endType: 'date', endDate: '2025-05-30' },
    };

    await act(async () => await result.current.saveEvent({ ...event, title: '수정된 일정' }));
    expect(result.current.events[0].repeat.type).toBe('none');
  });

  it('반복 일정의 특정 인스턴스를 삭제하면 해당 인스턴스만 삭제된다', async () => {
    setupMockHandlerCreation();
    // 반복 일정 생성
    const event = createEvent({
      repeat: { type: 'daily', interval: 1, endType: 'date', endDate: '2025-05-03' },
    });
    const createdEvent = [
      { ...event, id: '1', date: '2025-05-01' },
      { ...event, id: '2', date: '2025-05-02' },
      { ...event, id: '3', date: '2025-05-03' },
    ];
    setupMockHandlerDeletion(createdEvent);

    const { result } = renderHook(() => useEventOperations(false));

    // 이벤트가 정상적으로 저장되었는지 확인
    await act(async () => await result.current.saveEvent(createdEvent[0]));
    await act(async () => await result.current.saveEvent(createdEvent[1]));
    await act(async () => await result.current.saveEvent(createdEvent[2]));
    expect(result.current.events).toEqual(createdEvent);

    // 삭제 호출 (id: '1' 삭제)
    await act(async () => await result.current.deleteEvent('1'));

    await act(() => Promise.resolve(null));
    // 삭제 후, id가 '1'인 이벤트가 배열에서 제거된 상태로 검증
    expect(result.current.events).toEqual([
      { ...event, id: '2', date: '2025-05-02' },
      { ...event, id: '3', date: '2025-05-03' },
    ]);
  });

  it('매년 반복 일정은 윤년 2월 29일일 경우 평년에는 건너뛴다', async () => {
    setupMockHandlerCreation();
    const { result } = renderHook(() => useEventOperations(false));
    const event = createEvent({
      date: '2024-02-29',
      repeat: { type: 'yearly', interval: 1, endType: 'date', endDate: '2028-03-01' },
    });
    await act(async () => await result.current.saveEvent(event));

    expect(result.current.events).toEqual([
      { ...event, id: '1', date: '2024-02-29' },
      { ...event, id: '2', date: '2028-02-29' },
    ]);
  });

  it('매월 31일 반복 시 해당 월에 31일이 없으면 말일로 대체된다', async () => {
    setupMockHandlerCreation();
    const { result } = renderHook(() => useEventOperations(false));
    const event = createEvent({
      date: '2025-05-31',
      repeat: { type: 'monthly', interval: 1, endType: 'date', endDate: '2025-07-31' },
    });
    await act(async () => await result.current.saveEvent(event));

    expect(result.current.events).toEqual([
      { ...event, id: '1', date: '2025-05-31' },
      { ...event, id: '2', date: '2025-06-30' },
      { ...event, id: '3', date: '2025-07-31' },
    ]);
  });

  it('반복 간격이 적용된 주간 반복에서 요일이 일치하는 날짜에만 생성된다', async () => {
    setupMockHandlerCreation();
    const { result } = renderHook(() => useEventOperations(false));
    const event = createEvent({
      date: '2025-05-07',
      repeat: { type: 'weekly', interval: 1, endType: 'date', endDate: '2025-05-21' },
    });
    await act(async () => await result.current.saveEvent(event));

    expect(result.current.events).toEqual([
      { ...event, id: '1', date: '2025-05-07' },
      { ...event, id: '2', date: '2025-05-14' },
      { ...event, id: '3', date: '2025-05-21' },
    ]);
  });

  it('반복 없음 설정 시 단일 일정만 생성된다', async () => {
    setupMockHandlerCreation();
    const { result } = renderHook(() => useEventOperations(false));
    const event = createEvent({
      repeat: { type: 'none', interval: 0, endType: 'date', endDate: undefined },
    });

    await act(async () => await result.current.saveEvent(event));
    expect(result.current.events).toEqual([{ ...event, id: '1' }]);
  });
});
