import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { useRecurringEvents } from '../../hooks/useRecurringEvents';
import { Event } from '../../types';
import * as eventOverlap from '../../utils/eventOverlap';
import * as repeatEventUtils from '../../utils/repeatEventUtils';

describe('useRecurringEvents Hook', () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      title: '반복 이벤트',
      date: '2025-02-12',
      startTime: '18:00',
      endTime: '19:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, endType: 'date', endDate: '2025-03-05' },
      notificationTime: 10,
      isRecurring: true,
    },
  ];

  const mockProps = {
    events: mockEvents,
    saveEvent: vi.fn().mockResolvedValue(undefined),
    resetForm: vi.fn(),
    setOverlappingEvents: vi.fn(),
    setIsOverlapDialogOpen: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('중복되는 일정이 없을 경우 모든 반복 일정을 저장해야 한다', async () => {
    const mockRecurringEvents = [
      { ...mockEvents[0], id: '1-1' },
      { ...mockEvents[0], id: '1-2', date: '2025-02-19' },
    ];

    vi.spyOn(repeatEventUtils, 'generateRecurringEvents').mockReturnValue(mockRecurringEvents);
    vi.spyOn(eventOverlap, 'findOverlappingEvents').mockReturnValue([]);

    const { result } = renderHook(() => useRecurringEvents(mockProps));

    const success = await result.current.saveRecurringEvents(mockEvents[0]);

    expect(success).toBe(true);
    expect(mockProps.saveEvent).toHaveBeenCalledTimes(2);
    expect(mockProps.resetForm).toHaveBeenCalledTimes(1);
    expect(mockProps.setIsOverlapDialogOpen).not.toHaveBeenCalled();
  });

  it('중복되는 일정이 있을 경우 저장하지 않고 중복 다이얼로그를 열어야 한다', async () => {
    const mockRecurringEvents = [
      { ...mockEvents[0], id: '1-1' },
      { ...mockEvents[0], id: '1-2', date: '2025-02-19' },
    ];
    const mockOverlappingEvents = [{ ...mockEvents[0], id: '2' }];

    vi.spyOn(repeatEventUtils, 'generateRecurringEvents').mockReturnValue(mockRecurringEvents);
    vi.spyOn(eventOverlap, 'findOverlappingEvents').mockReturnValue(mockOverlappingEvents);

    const { result } = renderHook(() => useRecurringEvents(mockProps));

    const success = await result.current.saveRecurringEvents(mockEvents[0]);

    expect(success).toBe(false);
    expect(mockProps.setOverlappingEvents).toHaveBeenCalledWith(mockOverlappingEvents);
    expect(mockProps.setIsOverlapDialogOpen).toHaveBeenCalledWith(true);
    expect(mockProps.saveEvent).not.toHaveBeenCalled();
    expect(mockProps.resetForm).not.toHaveBeenCalled();
  });

  it('이벤트가 비어있는 경우에도 정상적으로 동작해야 한다', async () => {
    const emptyProps = {
      ...mockProps,
      events: [],
    };

    const { result } = renderHook(() => useRecurringEvents(emptyProps));
    expect(result.current.saveRecurringEvents).toBeDefined();
  });
});
