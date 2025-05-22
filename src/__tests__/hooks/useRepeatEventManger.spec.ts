import { renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { vi } from 'vitest';

import { useRecurringEvents } from '../../hooks/useRegisterSchedule.ts';
import { EventForm } from '../../types';
import * as overlapUtil from '../../utils/eventOverlap';
import * as repeatUtil from '../../utils/repeatUtils';

const mockEvents = [];

const mockProps = {
  events: mockEvents,
  saveEvent: vi.fn().mockResolvedValue(undefined),
  resetForm: vi.fn(),
  setOverlappingEvents: vi.fn(),
  setIsOverlapDialogOpen: vi.fn(),
};

describe('useRecurringEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('중복이 없으면 모든 반복 일정을 저장해야 한다', async () => {
    const formData: EventForm = {
      title: '회의',
      date: '2025-05-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'daily', interval: 1, endDate: '2025-05-03' },
      notificationTime: 10,
    };

    const mockDates = ['2025-05-01', '2025-05-02', '2025-05-03'];
    vi.spyOn(repeatUtil, 'generateRepeatDates').mockReturnValue(mockDates);
    vi.spyOn(overlapUtil, 'findOverlappingEvents').mockReturnValue([]);

    const { result } = renderHook(() => useRecurringEvents(mockProps));

    await act(async () => {
      const success = await result.current.saveRecurringEvents({
        formData,
        isRepeating: true,
        repeatType: 'daily',
        repeatInterval: 1,
        repeatEndType: 'date',
        repeatEndDate: '2025-05-03',
      });

      expect(success).toBe(true);
      expect(mockProps.saveEvent).toHaveBeenCalledTimes(mockDates.length);
      expect(mockProps.resetForm).toHaveBeenCalled();
    });
  });

  it('중복이 있으면 저장하지 않고 다이얼로그만 연다', async () => {
    const formData: EventForm = {
      title: '중복 회의',
      date: '2025-05-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'daily', interval: 1, endDate: '2025-05-03' },
      notificationTime: 10,
    };

    vi.spyOn(repeatUtil, 'generateRepeatDates').mockReturnValue(['2025-05-01']);
    vi.spyOn(overlapUtil, 'findOverlappingEvents').mockReturnValue([formData]);

    const { result } = renderHook(() => useRecurringEvents(mockProps));

    await act(async () => {
      const success = await result.current.saveRecurringEvents({
        formData,
        isRepeating: true,
        repeatType: 'daily',
        repeatInterval: 1,
        repeatEndType: 'date',
        repeatEndDate: '2025-05-03',
      });

      expect(success).toBe(false);
      expect(mockProps.setOverlappingEvents).toHaveBeenCalledWith([formData]);
      expect(mockProps.setIsOverlapDialogOpen).toHaveBeenCalledWith(true);
      expect(mockProps.saveEvent).not.toHaveBeenCalled();
      expect(mockProps.resetForm).not.toHaveBeenCalled();
    });
  });

  it('이벤트가 없어도 훅은 정상적으로 동작해야 한다', () => {
    const { result } = renderHook(() => useRecurringEvents({ ...mockProps, events: [] }));
    expect(result.current.saveRecurringEvents).toBeDefined();
  });
});
