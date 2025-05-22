import { act, renderHook } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';

import { useProcessedEvents } from '../../hooks/use-processed-events';
// eslint-disable-next-line import/order
import { Event } from '../../types';

// Mock dependencies
vi.mock('../../utils/dateUtils', () => ({
  getDateRange: vi.fn(),
  createDate: vi.fn(),
  getLastDateStringOfMonth: vi.fn(),
}));

vi.mock('../../utils/recur-rule', () => ({
  RecurRule: vi.fn(),
}));

import { getDateRange, createDate, getLastDateStringOfMonth } from '../../utils/dateUtils';
import { RecurRule } from '../../utils/recur-rule';

const mockGetDateRange = vi.mocked(getDateRange);
const mockCreateDate = vi.mocked(createDate);
const mockGetLastDateStringOfMonth = vi.mocked(getLastDateStringOfMonth);
const MockRecurRule = vi.mocked(RecurRule);

describe('useProcessedEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 기본 mock 설정
    mockGetDateRange.mockReturnValue({
      startDate: new Date(2025, 0, 1), // 2025-01-01
      endDate: new Date(2025, 0, 31), // 2025-01-31
    });

    mockCreateDate.mockImplementation((dateString: string, endOfDay = false) => {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (endOfDay) {
        date.setHours(23, 59, 59, 999);
      } else {
        date.setHours(0, 0, 0, 0);
      }
      return date;
    });

    mockGetLastDateStringOfMonth.mockReturnValue('2025-01-31');
  });

  describe('기본 동작', () => {
    test('빈 이벤트 배열에 대해 빈 배열을 반환한다', () => {
      const { result } = renderHook(() => useProcessedEvents([], new Date(2025, 0, 15), 'month'));

      expect(result.current).toEqual([]);
    });

    test('null 이벤트 배열에 대해 빈 배열을 반환한다', () => {
      const { result } = renderHook(() =>
        useProcessedEvents(null as any, new Date(2025, 0, 15), 'month')
      );

      expect(result.current).toEqual([]);
    });
  });

  describe('일반 이벤트 처리', () => {
    test('범위 내 일반 이벤트만 필터링한다', () => {
      const events: Event[] = [
        {
          id: '1',
          title: 'Event 1',
          date: '2025-01-15',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 1 },
          notificationTime: 10,
        },
        {
          id: '2',
          title: 'Event 2',
          date: '2025-02-15', // 범위 밖
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 1 },
          notificationTime: 10,
        },
      ];

      mockCreateDate.mockImplementation((dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
      });

      const { result } = renderHook(() =>
        useProcessedEvents(events, new Date(2025, 0, 15), 'month')
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].id).toBe('1');
    });

    test('일반 이벤트가 날짜순으로 정렬된다', () => {
      const events: Event[] = [
        {
          id: '2',
          title: 'Event 2',
          date: '2025-01-20',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 1 },
          notificationTime: 10,
        },
        {
          id: '1',
          title: 'Event 1',
          date: '2025-01-10',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 1 },
          notificationTime: 10,
        },
      ];

      mockCreateDate.mockImplementation((dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
      });

      const { result } = renderHook(() =>
        useProcessedEvents(events, new Date(2025, 0, 15), 'month')
      );

      expect(result.current[0].date).toBe('2025-01-10');
      expect(result.current[1].date).toBe('2025-01-20');
    });
  });

  describe('반복 이벤트 처리 - 횟수 기반', () => {
    test('횟수 기반 반복 이벤트를 처리한다', () => {
      const events: Event[] = [
        {
          id: '1',
          title: 'Daily Event',
          date: '2025-01-01',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'daily', interval: 1, count: 5 },
          notificationTime: 10,
        },
      ];

      const mockRuleInstance = {
        all: vi
          .fn()
          .mockReturnValue([
            new Date(2025, 0, 1),
            new Date(2025, 0, 2),
            new Date(2025, 0, 3),
            new Date(2025, 0, 4),
            new Date(2025, 0, 5),
          ]),
        between: vi.fn(),
      };

      MockRecurRule.mockImplementation(() => mockRuleInstance as any);

      const { result } = renderHook(() =>
        useProcessedEvents(events, new Date(2025, 0, 15), 'month')
      );

      expect(MockRecurRule).toHaveBeenCalledWith({
        frequency: 'daily',
        interval: 1,
        start: expect.any(Date),
        count: 5,
      });

      expect(mockRuleInstance.all).toHaveBeenCalled();
      expect(result.current).toHaveLength(5);
    });

    test('범위 밖 반복 인스턴스는 필터링된다', () => {
      const events: Event[] = [
        {
          id: '1',
          title: 'Daily Event',
          date: '2025-01-01',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'daily', interval: 1, count: 10 },
          notificationTime: 10,
        },
      ];

      const mockRuleInstance = {
        all: vi.fn().mockReturnValue([
          new Date(2024, 11, 30), // 범위 밖
          new Date(2025, 0, 1), // 범위 내
          new Date(2025, 0, 2), // 범위 내
          new Date(2025, 1, 1), // 범위 밖
        ]),
        between: vi.fn(),
      };

      MockRecurRule.mockImplementation(() => mockRuleInstance as any);

      const { result } = renderHook(() =>
        useProcessedEvents(events, new Date(2025, 0, 15), 'month')
      );

      // 범위 내 인스턴스만 포함되어야 함
      expect(result.current).toHaveLength(2);
      expect(result.current[0].date).toBe('2025-01-01');
      expect(result.current[1].date).toBe('2025-01-02');
    });
  });

  describe('반복 이벤트 처리 - 날짜 기반', () => {
    test('날짜 기반 반복 이벤트를 처리한다', () => {
      const events: Event[] = [
        {
          id: '1',
          title: 'Weekly Event',
          date: '2025-01-01',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'weekly', interval: 1, endDate: '2025-01-31' },
          notificationTime: 10,
        },
      ];

      const mockRuleInstance = {
        all: vi.fn(),
        between: vi
          .fn()
          .mockReturnValue([
            new Date(2025, 0, 1),
            new Date(2025, 0, 8),
            new Date(2025, 0, 15),
            new Date(2025, 0, 22),
            new Date(2025, 0, 29),
          ]),
      };

      MockRecurRule.mockImplementation(() => mockRuleInstance as any);

      const { result } = renderHook(() =>
        useProcessedEvents(events, new Date(2025, 0, 15), 'month')
      );

      expect(MockRecurRule).toHaveBeenCalledWith({
        frequency: 'weekly',
        interval: 1,
        start: expect.any(Date),
        until: expect.any(Date),
      });

      expect(mockRuleInstance.between).toHaveBeenCalled();
      expect(result.current).toHaveLength(5);
    });
  });

  describe('반복 이벤트 처리 - 기본값', () => {
    test('count와 endDate가 모두 없으면 현재 월 말일까지 처리한다', () => {
      const events: Event[] = [
        {
          id: '1',
          title: 'Monthly Event',
          date: '2025-01-01',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'monthly', interval: 1 },
          notificationTime: 10,
        },
      ];

      const mockRuleInstance = {
        all: vi.fn(),
        between: vi.fn().mockReturnValue([new Date(2025, 0, 1)]),
      };

      MockRecurRule.mockImplementation(() => mockRuleInstance as any);

      renderHook(() => useProcessedEvents(events, new Date(2025, 0, 15), 'month'));

      expect(mockGetLastDateStringOfMonth).toHaveBeenCalledWith(new Date(2025, 0, 15));
      expect(MockRecurRule).toHaveBeenCalledWith({
        frequency: 'monthly',
        interval: 1,
        start: expect.any(Date),
        until: expect.any(Date),
      });
    });
  });

  describe('예외 날짜 처리', () => {
    test('예외 날짜는 반복 인스턴스에서 제외된다', () => {
      const events: Event[] = [
        {
          id: '1',
          title: 'Daily Event',
          date: '2025-01-01',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: {
            type: 'daily',
            interval: 1,
            count: 5,
            exceptions: ['2025-01-03'], // 1월 3일 제외
          },
          notificationTime: 10,
        },
      ];

      const mockRuleInstance = {
        all: vi.fn().mockReturnValue([
          new Date(2025, 0, 1),
          new Date(2025, 0, 2),
          new Date(2025, 0, 3), // 예외 날짜
          new Date(2025, 0, 4),
          new Date(2025, 0, 5),
        ]),
        between: vi.fn(),
      };

      MockRecurRule.mockImplementation(() => mockRuleInstance as any);

      const { result } = renderHook(() =>
        useProcessedEvents(events, new Date(2025, 0, 15), 'month')
      );

      // 예외 날짜(1월 3일)가 제외되어 4개만 반환되어야 함
      expect(result.current).toHaveLength(4);
      expect(result.current.map((e) => e.date)).not.toContain('2025-01-03');
    });
  });

  describe('가상 인스턴스 ID 생성', () => {
    test('원본 날짜가 아닌 인스턴스는 새로운 ID를 가진다', () => {
      const events: Event[] = [
        {
          id: 'original-id',
          title: 'Daily Event',
          date: '2025-01-01',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'daily', interval: 1, count: 3 },
          notificationTime: 10,
        },
      ];

      const mockRuleInstance = {
        all: vi.fn().mockReturnValue([
          new Date(2025, 0, 1), // 원본 날짜
          new Date(2025, 0, 2), // 가상 인스턴스
          new Date(2025, 0, 3), // 가상 인스턴스
        ]),
        between: vi.fn(),
      };

      MockRecurRule.mockImplementation(() => mockRuleInstance as any);

      const { result } = renderHook(() =>
        useProcessedEvents(events, new Date(2025, 0, 15), 'month')
      );

      expect(result.current[0].id).toBe('original-id'); // 원본 ID 유지
      expect(result.current[1].id).toBe('original-id-2025-01-02'); // 새 ID
      expect(result.current[2].id).toBe('original-id-2025-01-03'); // 새 ID
    });

    test('원본 날짜 인스턴스는 기존 ID를 유지한다', () => {
      const events: Event[] = [
        {
          id: 'original-id',
          title: 'Daily Event',
          date: '2025-01-01',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'daily', interval: 1, count: 1 },
          notificationTime: 10,
        },
      ];

      const mockRuleInstance = {
        all: vi.fn().mockReturnValue([
          new Date(2025, 0, 1), // 원본 날짜와 동일
        ]),
        between: vi.fn(),
      };

      MockRecurRule.mockImplementation(() => mockRuleInstance as any);

      const { result } = renderHook(() =>
        useProcessedEvents(events, new Date(2025, 0, 15), 'month')
      );

      expect(result.current[0].id).toBe('original-id'); // 원본 ID 유지
    });
  });

  describe('에러 처리', () => {
    test('RecurRule 생성 중 에러가 발생하면 해당 이벤트를 건너뛴다', () => {
      const events: Event[] = [
        {
          id: '1',
          title: 'Valid Event',
          date: '2025-01-01',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 1 },
          notificationTime: 10,
        },
        {
          id: '2',
          title: 'Error Event',
          date: '2025-01-02',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'daily', interval: 1, count: 5 },
          notificationTime: 10,
        },
      ];

      MockRecurRule.mockImplementation(() => {
        throw new Error('RecurRule error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() =>
        useProcessedEvents(events, new Date(2025, 0, 15), 'month')
      );

      // 일반 이벤트만 반환되어야 함
      expect(result.current).toHaveLength(1);
      expect(result.current[0].id).toBe('1');
      expect(consoleSpy).toHaveBeenCalledWith(
        'RecurRule 생성 또는 계산 중 오류:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('메모이제이션', () => {
    test('동일한 입력에 대해 동일한 결과를 반환한다', async () => {
      const events: Event[] = [
        {
          id: '1',
          title: 'Event 1',
          date: '2025-01-15',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: 'none', interval: 1 },
          notificationTime: 10,
        },
      ];

      const currentDate = new Date(2025, 0, 15);

      const { result, rerender } = renderHook(
        ({ events, currentDate, view }) => useProcessedEvents(events, currentDate, view),
        { initialProps: { events, currentDate, view: 'month' as const } }
      );

      const firstResult = result.current;

      // 동일한 props로 재렌더링
      await act(async () => {
        rerender({ events, currentDate, view: 'month' as const });
      });

      // 결과가 동일한 참조여야 함 (메모이제이션 작동)
      expect(result.current).toBe(firstResult);
    });
  });

  describe('다양한 반복 타입', () => {
    test.each([
      ['daily', 'daily'],
      ['weekly', 'weekly'],
      ['monthly', 'monthly'],
      ['yearly', 'yearly'],
    ])('%s 반복 타입을 올바르게 처리한다', (repeatType) => {
      const events: Event[] = [
        {
          id: '1',
          title: `${repeatType} Event`,
          date: '2025-01-01',
          startTime: '10:00',
          endTime: '11:00',
          description: '',
          location: '',
          category: '',
          repeat: { type: repeatType as any, interval: 1, count: 3 },
          notificationTime: 10,
        },
      ];

      const mockRuleInstance = {
        all: vi.fn().mockReturnValue([new Date(2025, 0, 1)]),
        between: vi.fn(),
      };

      MockRecurRule.mockImplementation(() => mockRuleInstance as any);

      renderHook(() => useProcessedEvents(events, new Date(2025, 0, 15), 'month'));

      expect(MockRecurRule).toHaveBeenCalledWith(
        expect.objectContaining({
          frequency: repeatType,
        })
      );
    });
  });
});
