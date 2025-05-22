import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { useRepeatSchedule } from '../hooks/useRepeatSchedule';
import * as utils from '../utils/generateRepeatedEvents';

describe('useRepeatSchedule', () => {
  const mockCallback = vi.fn();
  const mockEvents = [
    {
      title: 'a',
      date: '2025-01-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      notificationTime: 10,
      repeat: { type: 'daily', interval: 1, endDate: '2025-01-02' },
    },
  ];

  beforeEach(() => {
    vi.spyOn(utils, 'generateRepeatedEvents').mockReturnValue(mockEvents as any);
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockEvents) })
    ) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generateRepeatedEvents를 호출하고 fetch 요청을 보낸다', async () => {
    const { result } = renderHook(() => useRepeatSchedule(mockCallback));
    await result.current.saveRepeatingSchedule(
      {
        title: 'test',
        date: '2025-01-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '',
        notificationTime: 10,
      },
      {
        type: 'daily',
        interval: 1,
        endDate: '2025-01-03',
      }
    );

    expect(utils.generateRepeatedEvents).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith('/api/events-list', expect.anything());
    expect(mockCallback).toHaveBeenCalled();
  });

  it('요청 실패 시 에러를 던진다', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false } as any);
    const { result } = renderHook(() => useRepeatSchedule(() => {}));
    await expect(() => result.current.saveRepeatingSchedule({} as any, {} as any)).rejects.toThrow(
      'Failed to save repeating events'
    );
  });
});
