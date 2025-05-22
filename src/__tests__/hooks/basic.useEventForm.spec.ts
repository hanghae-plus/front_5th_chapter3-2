import { act, renderHook } from '@testing-library/react';

import { useEventForm } from '@/hooks/useEventForm';

describe('useEventForm', () => {
  describe('setDate 동작 확인', () => {
    it('31일이 없는 달에는 그 전날인 30일로 설정되어야 한다', () => {
      const { result } = renderHook(() => useEventForm());
      act(() => {
        result.current.setDate('2025-04-31');
      });
      expect(result.current.date).toBe('2025-04-30');
    });

    it('31일이 있는 달에는 그대로 설정되어야 한다', () => {
      const { result } = renderHook(() => useEventForm());
      act(() => {
        result.current.setDate('2025-05-31');
      });
      expect(result.current.date).toBe('2025-05-31');
    });

    describe('윤년 날짜 설정', () => {
      it('윤년이 아닌 해의 2월 29일을 그 전날인 2월 28일로 설정되어야 한다', () => {
        const { result } = renderHook(() => useEventForm());
        act(() => {
          result.current.setDate('2025-02-29');
        });
        expect(result.current.date).toBe('2025-02-28');
      });

      it('윤년의 2월 29일은 그대로 설정되어야 한다', () => {
        const { result } = renderHook(() => useEventForm());
        act(() => {
          result.current.setDate('2024-02-29');
        });
        expect(result.current.date).toBe('2024-02-29');
      });
    });
  });

  describe('반복 일정 설정', () => {
    it('반복 유형을 설정할 수 있어야 한다', () => {
      const { result } = renderHook(() => useEventForm());

      expect(result.current.repeatType).toBe('none');

      act(() => {
        result.current.setRepeatType('daily');
      });

      expect(result.current.repeatType).toBe('daily');

      act(() => {
        result.current.setRepeatType('weekly');
      });
      expect(result.current.repeatType).toBe('weekly');

      act(() => {
        result.current.setRepeatType('monthly');
      });
      expect(result.current.repeatType).toBe('monthly');

      act(() => {
        result.current.setRepeatType('yearly');
      });
      expect(result.current.repeatType).toBe('yearly');
    });

    it('반복 간격을 설정할 수 있어야 한다', () => {
      const { result } = renderHook(() => useEventForm());

      expect(result.current.repeatInterval).toBe(1);

      act(() => {
        result.current.setRepeatInterval(3);
      });
      expect(result.current.repeatInterval).toBe(3);
    });
  });

  describe('폼 초기화 및 편집', () => {
    it('resetForm 함수가 모든 필드를 초기화해야 한다', () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.setTitle('테스트 제목');
        result.current.setDate('2025-05-15');
        result.current.setIsRepeating(true);
        result.current.setRepeatType('weekly');
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.title).toBe('');
      expect(result.current.date).toBe('');
      expect(result.current.isRepeating).toBe(false);
      expect(result.current.repeatType).toBe('none');
    });

    it('editEvent 함수가 이벤트 데이터로 폼을 채워야 한다', () => {
      const { result } = renderHook(() => useEventForm());

      const testEvent = {
        id: '1',
        title: '테스트 일정',
        date: '2025-06-15',
        startTime: '10:00',
        endTime: '11:00',
        description: '테스트 설명',
        location: '테스트 장소',
        category: '업무',
        repeat: {
          type: 'weekly' as const,
          interval: 2,
          endDate: '2025-08-15',
        },
        notificationTime: 15,
      };

      act(() => {
        result.current.editEvent(testEvent);
      });

      expect(result.current.title).toBe('테스트 일정');
      expect(result.current.date).toBe('2025-06-15');
      expect(result.current.startTime).toBe('10:00');
      expect(result.current.endTime).toBe('11:00');
      expect(result.current.description).toBe('테스트 설명');
      expect(result.current.isRepeating).toBe(true);
      expect(result.current.repeatType).toBe('weekly');
      expect(result.current.repeatInterval).toBe(2);
      expect(result.current.notificationTime).toBe(15);
    });
  });

  describe('반복 종료 조건 설정', () => {
    it('maxOccurrences를 설정할 수 있어야 한다', () => {
      const { result } = renderHook(() => useEventForm());

      expect(result.current.maxOccurrences).toBeUndefined();

      act(() => {
        result.current.setMaxOccurrences(10);
      });

      expect(result.current.maxOccurrences).toBe(10);

      act(() => {
        result.current.setMaxOccurrences(5);
      });
      expect(result.current.maxOccurrences).toBe(5);
    });

    it('maxOccurrences를 undefined로 초기화할 수 있어야 한다', () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.setMaxOccurrences(20);
      });
      expect(result.current.maxOccurrences).toBe(20);

      act(() => {
        result.current.setMaxOccurrences(undefined);
      });
      expect(result.current.maxOccurrences).toBeUndefined();
    });

    it('resetForm 함수가 maxOccurrences도 초기화해야 한다', () => {
      const { result } = renderHook(() => useEventForm());

      act(() => {
        result.current.setMaxOccurrences(15);
        result.current.setRepeatEndDate('2025-12-31');
      });

      expect(result.current.maxOccurrences).toBe(15);

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.maxOccurrences).toBeUndefined();
      expect(result.current.repeatEndDate).toBe('');
    });

    it('editEvent 함수가 maxOccurrences를 포함한 이벤트 데이터로 폼을 채워야 한다', () => {
      const { result } = renderHook(() => useEventForm());

      const event = {
        id: '2',
        title: '반복 횟수 제한 일정',
        date: '2025-07-01',
        startTime: '14:00',
        endTime: '15:00',
        description: '5회만 반복',
        location: '회의실',
        category: '회의',
        repeat: {
          type: 'daily' as const,
          interval: 1,
          endDate: '2025-07-10',
          maxOccurrences: 5,
        },
        notificationTime: 30,
      };

      act(() => {
        result.current.editEvent(event);
      });

      expect(result.current.maxOccurrences).toBe(5);
      expect(result.current.repeatType).toBe('daily');
      expect(result.current.repeatInterval).toBe(1);
      expect(result.current.repeatEndDate).toBe('2025-07-10');
    });

    it('editEvent 함수가 maxOccurrences가 없는 이벤트를 처리해야 한다', () => {
      const { result } = renderHook(() => useEventForm());

      const testEventWithoutMaxOccurrences = {
        id: '3',
        title: '무제한 반복 일정',
        date: '2025-08-01',
        startTime: '09:00',
        endTime: '10:00',
        description: '종료일까지만 반복',
        location: '사무실',
        category: '업무',
        repeat: {
          type: 'weekly' as const,
          interval: 2,
          endDate: '2025-12-31',
        },
        notificationTime: 60,
      };

      act(() => {
        result.current.editEvent(testEventWithoutMaxOccurrences);
      });

      expect(result.current.maxOccurrences).toBeUndefined();
      expect(result.current.repeatType).toBe('weekly');
      expect(result.current.repeatEndDate).toBe('2025-12-31');
    });
  });
});
