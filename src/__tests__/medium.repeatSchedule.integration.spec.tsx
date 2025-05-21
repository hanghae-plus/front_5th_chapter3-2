import { ChakraProvider } from '@chakra-ui/react';
import { act, render, renderHook, screen } from '@testing-library/react';

import {
  setupMockHandlerEventListCreation,
  setupMockHandlerEventListDeletion,
  setupMockHandlerEventListUpdating,
} from '../__mocks__/handlersUtils';
import EventItem from '../components/EventItem';
import { useEventOperations } from '../hooks/useEventOperations';
import { Event } from '../types';
import { generateRepeats } from '../utils/repeatUtils';

describe('반복 유형 선택 - 통합테스트', () => {
  it('2월 29일에 시작하는 연간 반복 일정은 윤년에만 생성되어 저장된다.', async () => {
    setupMockHandlerEventListCreation();

    const { result } = renderHook(() => useEventOperations(false, true));

    await act(() => Promise.resolve(null));

    const baseEvent = {
      id: '',
      title: '윤년 테스트',
      date: '2024-02-29',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '기타',
      repeat: { type: 'yearly', interval: 1, endDate: '2032-12-31' },
      notificationTime: 10,
    } as Omit<Event, 'id'>;

    await act(async () => {
      await result.current.saveEvent(baseEvent as Event);
    });

    const savedDates = result.current.events.map((e) => e.date);

    expect(savedDates).toEqual(['2024-02-29', '2028-02-29', '2032-02-29']);
  });

  it('매월 31일로 설정한 반복 일정은 31일이 있는 달에만 생성된다.', async () => {
    setupMockHandlerEventListCreation();
    const { result } = renderHook(() => useEventOperations(false, true));

    await act(() => Promise.resolve(null));

    const baseEvent = {
      id: '',
      title: '매월 31일 일정',
      date: '2025-01-31',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '정기',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-06-30' },
      notificationTime: 10,
    } as Omit<Event, 'id'>;

    await act(async () => {
      await result.current.saveEvent(baseEvent);
    });

    const savedDates = result.current.events.map((e) => e.date);

    expect(savedDates).toEqual(['2025-01-31', '2025-03-31', '2025-05-31']);
  });
});

describe('반복 간격 설정', () => {
  it('2일마다 반복 일정이 저장되고, 올바른 간격으로 생성된다.', async () => {
    setupMockHandlerEventListCreation();
    const { result } = renderHook(() => useEventOperations(false, true));

    await act(() => Promise.resolve(null));

    const baseEvent = {
      id: '',
      title: '2일 간격 테스트',
      date: '2025-05-19',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '회의실',
      category: '반복',
      repeat: {
        type: 'daily',
        interval: 2,
        endDate: '2025-05-30',
      },
      notificationTime: 10,
    } as Omit<Event, 'id'>;

    await act(async () => {
      await result.current.saveEvent(baseEvent);
    });

    const savedDates = result.current.events.map((e) => e.date);

    expect(savedDates).toEqual([
      '2025-05-19',
      '2025-05-21',
      '2025-05-23',
      '2025-05-25',
      '2025-05-27',
      '2025-05-29',
    ]);
  });

  it('2주마다 반복 일정이 저장되고, 올바른 간격으로 생성된다.', async () => {
    setupMockHandlerEventListCreation();
    const { result } = renderHook(() => useEventOperations(false, true));

    await act(() => Promise.resolve(null));

    const baseEvent = {
      id: '',
      title: '2주 간격 테스트',
      date: '2025-05-19',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '회의실',
      category: '반복',
      repeat: {
        type: 'weekly',
        interval: 2,
        endDate: '2025-06-30',
      },
      notificationTime: 10,
    } as Omit<Event, 'id'>;

    await act(async () => {
      await result.current.saveEvent(baseEvent);
    });

    const savedDates = result.current.events.map((e) => e.date);

    expect(savedDates.length).toBe(4);
  });

  it('3개월마다 반복 일정이 저장되고, 올바른 간격으로 생성된다.', async () => {
    setupMockHandlerEventListCreation();
    const { result } = renderHook(() => useEventOperations(false, true));

    await act(() => Promise.resolve(null));

    const baseEvent = {
      id: '',
      title: '3개월 간격 테스트',
      date: '2025-05-19',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '회의실',
      category: '반복',
      repeat: {
        type: 'monthly',
        interval: 3,
        endDate: '2025-12-30',
      },
      notificationTime: 10,
    } as Omit<Event, 'id'>;

    await act(async () => {
      await result.current.saveEvent(baseEvent);
    });

    const savedDates = result.current.events.map((e) => e.date);

    expect(savedDates.length).toBe(3);
  });
});

describe('반복 일정 표시', () => {
  it('반복 일정으로 저장된 이벤트는 제목 앞에 🔁 아이콘이 붙어 UI에 표시된다.', async () => {
    setupMockHandlerEventListCreation();

    const testEvent = {
      id: '',
      title: '테스트 반복 일정',
      date: '2025-05-19',
      startTime: '10:00',
      endTime: '11:00',
      description: '반복 일정 테스트 설명',
      location: '회의실 B',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-05-20',
      },
      notificationTime: 10,
    } as Omit<Event, 'id'>;

    const { result } = renderHook(() => useEventOperations(false, true));

    await act(async () => {
      await result.current.saveEvent(testEvent);
    });

    // 테스트에 사용할 이벤트를 렌더링
    render(
      <ChakraProvider>
        <EventItem event={result.current.events[0]} isNotified={false} />
      </ChakraProvider>
    );

    expect(screen.getByText('🔁 테스트 반복 일정')).toBeInTheDocument();
  });
});

describe('반복 종료', () => {
  it('반복 종료 조건이 "특정 날짜"일 경우, 해당 날짜까지만 반복 일정이 저장된다.', async () => {
    setupMockHandlerEventListCreation();

    const { result } = renderHook(() => useEventOperations(false, true));
    await act(() => Promise.resolve(null));

    const startDate = new Date('2025-05-01');
    const endDate = new Date('2025-05-05');

    const baseEvent = {
      id: '',
      title: '종료 조건 테스트',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: endDate.toISOString().slice(0, 10),
      },
      notificationTime: 10,
    } as Omit<Event, 'id' | 'date'>;

    const events = generateRepeats(startDate, baseEvent.repeat).map((date) => ({
      ...baseEvent,
      id: '',
      date: date.toISOString().slice(0, 10),
    }));

    for (const event of events) {
      await act(async () => {
        await result.current.saveEvent(event);
      });
    }

    const savedDates = result.current.events.map((e) => e.date);

    expect(savedDates).toEqual([
      '2025-05-01',
      '2025-05-02',
      '2025-05-03',
      '2025-05-04',
      '2025-05-05',
    ]);
  });

  it('종료 조건이 "반복 횟수"이고 2일 간격일 경우, 해당 날짜까지만 반복 일정이 저장된다.', async () => {
    setupMockHandlerEventListCreation();

    const { result } = renderHook(() => useEventOperations(false, true));
    await act(() => Promise.resolve(null));

    const startDate = new Date('2025-05-20');

    const baseEvent = {
      id: '',
      title: '반복 종료 테스트',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 2,
        count: 2,
      },
      notificationTime: 10,
    } as Omit<Event, 'id' | 'date'>;

    const events = generateRepeats(startDate, baseEvent.repeat).map((date) => ({
      ...baseEvent,
      id: '',
      date: date.toISOString().slice(0, 10),
    }));

    for (const event of events) {
      await act(async () => {
        await result.current.saveEvent(event);
      });
    }

    const savedDates = result.current.events.map((e) => e.date);

    expect(savedDates).toEqual(['2025-05-20', '2025-05-22']);
  });

  it('종료 조건이 "없음"일 경우, 2025-09-30일까지 일정이 저장된다.', async () => {
    setupMockHandlerEventListCreation();

    const { result } = renderHook(() => useEventOperations(false, true));
    await act(() => Promise.resolve(null));

    const startDate = new Date('2025-05-22');
    const EndDate = new Date('2025-09-30');

    const baseEvent = {
      id: '',
      title: '무한 반복 테스트',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '회의실 B',
      category: '기타',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: EndDate.toISOString().slice(0, 10),
      },
      notificationTime: 10,
    } as Omit<Event, 'id' | 'date'>;

    const events = generateRepeats(startDate, baseEvent.repeat).map((date) => ({
      ...baseEvent,
      id: '',
      date: date.toISOString().slice(0, 10),
    }));

    // 일부만 저장 (성능 고려)
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await result.current.saveEvent(events[i]);
      });
    }

    const savedDates = result.current.events.map((e) => e.date);

    expect(savedDates).toEqual([
      '2025-05-22',
      '2025-05-23',
      '2025-05-24',
      '2025-05-25',
      '2025-05-26',
    ]);
    expect(events.length).toBe(132);
  });
});
describe('반복 일정 단일 수정', () => {
  it('반복 일정에서 반복 체크를 해제하면  단일 일정으로 변경되고, 🔁 아이콘이 사라진다.', async () => {
    setupMockHandlerEventListUpdating();

    const { result } = renderHook(() => useEventOperations(false, true));
    await act(() => Promise.resolve(null));

    // 1. 반복 일정 저장
    const originalEvent = {
      id: '',
      title: '반복 회의',
      date: '2025-05-20',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '업무',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-05-30',
      },
      notificationTime: 10,
    } as Omit<Event, 'id'>;

    await act(async () => {
      await result.current.saveEvent(originalEvent);
    });

    const saved = result.current.events[0];

    // 2. 반복 설정 해제하여 단일 일정으로 변경
    const updatedEvent = {
      ...saved,
      repeat: {
        type: 'none', // 🔁 해제
        interval: 0,
      },
    } as Event;

    await act(async () => {
      await result.current.saveEvent(updatedEvent);
    });

    render(
      <ChakraProvider>
        <EventItem event={result.current.events[0]} isNotified={false} />
      </ChakraProvider>
    );

    expect(screen.queryByText(/🔁/)).not.toBeInTheDocument();
  });
});

describe('반복 일정 단일 삭제', () => {
  it('반복 그룹에서 하나의 일정만 삭제하면, 해당 일정만 삭제된다.', async () => {
    setupMockHandlerEventListDeletion();

    const { result } = renderHook(() => useEventOperations(false, true));

    await act(() => Promise.resolve(null));

    await act(async () => {
      await result.current.deleteRepeatEvents([String(result.current.events[0].id)]);
    });

    await act(() => Promise.resolve(null));

    expect(result.current.events).toEqual([]);
  });
});
