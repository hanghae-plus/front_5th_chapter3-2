import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { useEventRepeat } from '../../hooks/useEventRepeat';
import { Event, EventForm } from '../../types';
import * as repeatUtils from '../../utils/repeatUtils';

// Mock API 통신
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockToast = vi.fn();
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => mockToast,
  };
});

describe('useRepeatEventService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it('생성: 반복 일정이 아닌 경우 단일 이벤트만 저장한다', async () => {
    // Mock 응답 설정
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'success' }),
    });

    const { result } = renderHook(() => useEventRepeat());

    const nonRepeatingEvent: EventForm = {
      title: '단일 이벤트',
      date: '2023-04-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '설명',
      location: '장소',
      category: '업무',
      repeat: { type: 'none', interval: 1 },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.createRepeatEvents(nonRepeatingEvent);
    });

    // 단 한 번만 호출되었는지 확인 (단일 이벤트)
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nonRepeatingEvent),
    });
  });

  it('생성: 반복 일정인 경우 여러 이벤트를 생성한다', async () => {
    // Mock 응답 설정
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'success' }),
    });

    // createRepeatingEvents 함수 모킹
    const mockRepeatingEvents: EventForm[] = [
      {
        title: '반복 이벤트',
        date: '2023-04-15', // 시작일
        startTime: '10:00',
        endTime: '11:00',
        description: '설명',
        location: '장소',
        category: '업무',
        repeat: { type: 'daily', interval: 2, endDate: '2023-04-19' },
        notificationTime: 10,
      },
      {
        title: '반복 이벤트',
        date: '2023-04-17', // 2일 후
        startTime: '10:00',
        endTime: '11:00',
        description: '설명',
        location: '장소',
        category: '업무',
        repeat: { type: 'daily', interval: 2, endDate: '2023-04-19' },
        notificationTime: 10,
      },
      {
        title: '반복 이벤트',
        date: '2023-04-19', // 4일 후 (종료일)
        startTime: '10:00',
        endTime: '11:00',
        description: '설명',
        location: '장소',
        category: '업무',
        repeat: { type: 'daily', interval: 2, endDate: '2023-04-19' },
        notificationTime: 10,
      },
    ];

    vi.spyOn(repeatUtils, 'createRepeatingEvents').mockReturnValue(mockRepeatingEvents);

    const { result } = renderHook(() => useEventRepeat());

    const repeatingEvent: EventForm = {
      title: '반복 이벤트',
      date: '2023-04-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '설명',
      location: '장소',
      category: '업무',
      repeat: { type: 'daily', interval: 2, endDate: '2023-04-19' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.createRepeatEvents(repeatingEvent);
    });

    // 각 반복 이벤트마다 API 호출이 있어야 함
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // 각 반복 일정에 대한 호출 확인
    for (let i = 0; i < mockRepeatingEvents.length; i++) {
      expect(mockFetch).toHaveBeenNthCalledWith(i + 1, '/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRepeatingEvents[i]),
      });
    }
  });

  it('수정: 반복 이벤트를 수정하면 해당 일정만 단일 일정으로 변경된다', async () => {
    // Mock 응답 설정
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'success' }),
    });

    const { result } = renderHook(() => useEventRepeat());

    const repeatingEvent: Event = {
      id: '123',
      title: '반복 이벤트',
      date: '2023-04-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '설명',
      location: '장소',
      category: '업무',
      repeat: { type: 'daily', interval: 2, endDate: '2023-04-19' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.updateSingleEvent(repeatingEvent);
    });

    // 반복 속성이 'none'으로 변경되어야 함
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/events/123', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...repeatingEvent,
        repeat: { ...repeatingEvent.repeat, type: 'none' },
      }),
    });
  });

  it('삭제: 반복 이벤트를 삭제하면 해당 일정만 삭제된다', async () => {
    // Mock 응답 설정
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'success' }),
    });

    const { result } = renderHook(() => useEventRepeat());

    await act(async () => {
      await result.current.deleteSingleEvent('123');
    });

    // 단일 삭제만 호출
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/events/123', {
      method: 'DELETE',
    });
  });

  it('에러 처리: API 호출 실패 시 에러 토스트가 표시된다', async () => {
    // 실패하는 응답 설정
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useEventRepeat());

    await act(async () => {
      await result.current.createRepeatEvents({
        title: '이벤트',
        date: '2023-04-15',
        startTime: '10:00',
        endTime: '11:00',
        description: '설명',
        location: '장소',
        category: '업무',
        repeat: { type: 'none', interval: 1 },
        notificationTime: 10,
      });
    });

    // 에러 토스트 호출 확인
    expect(mockToast).toHaveBeenCalledWith({
      title: '일정 저장 실패',
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
  });
});
