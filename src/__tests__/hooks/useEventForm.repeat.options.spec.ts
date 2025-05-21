// src/__tests__/hooks/useEventForm.repeat.options.spec.ts
import { act, renderHook } from '@testing-library/react';

import { useEventForm } from '../../hooks/useEventForm';
import { Event, RepeatInfo } from '../../types';

const DEFAULT_REPEAT_END_DATE_FOR_NO_END = '2025-09-30';

describe('useEventForm - 반복 종료 옵션 관리', () => {
  it('초기 상태에서는 repeatEndDate와 repeatCount가 모두 비어 있어야 한다', () => {
    const { result } = renderHook(() => useEventForm());
    expect(result.current.repeatEndDate).toBe('');
    expect(result.current.repeatCount).toBeUndefined();
  });

  // 특정 날짜까지
  it('setRepeatEndDate 호출 시 repeatEndDate가 설정되고 repeatCount는 undefined로 초기화되어야 한다', () => {
    const { result } = renderHook(() => useEventForm());
    act(() => result.current.setRepeatCount(5)); // 먼저 count 설정

    act(() => {
      result.current.setRepeatEndDate('2025-10-31');
    });

    expect(result.current.repeatEndDate).toBe('2025-10-31');
    expect(result.current.repeatCount).toBeUndefined();
  });

  // 특정 횟수만큼
  it('setRepeatCount 호출 시 repeatCount가 설정되고 repeatEndDate는 빈 문자열로 초기화되어야 한다', () => {
    const { result } = renderHook(() => useEventForm());
    act(() => result.current.setRepeatEndDate('2025-10-31')); // 먼저 endDate 설정

    act(() => {
      result.current.setRepeatCount(10);
    });

    expect(result.current.repeatCount).toBe(10);
    expect(result.current.repeatEndDate).toBe('');
  });

  it('setRepeatCount에 0 또는 음수 입력 시 1로 보정되어야 한다', () => {
    const { result } = renderHook(() => useEventForm());
    act(() => {
      result.current.setRepeatCount(0);
    });
    expect(result.current.repeatCount).toBe(1);

    act(() => {
      result.current.setRepeatCount(-5);
    });
    expect(result.current.repeatCount).toBe(1);
  });

  // 편집 시나리오
  it('endDate가 있는 이벤트 편집 시 repeatEndDate가 설정되고 repeatCount는 undefined여야 한다', () => {
    const eventWithEndDate: Event = {
      id: '1',
      title: '날짜 종료 이벤트',
      date: '2025-01-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      notificationTime: 10,
      repeat: { type: 'daily', interval: 1, endDate: '2025-01-10' },
    };
    const { result } = renderHook(() => useEventForm(eventWithEndDate));
    expect(result.current.repeatEndDate).toBe('2025-01-10');
    expect(result.current.repeatCount).toBeUndefined();
  });

  it('count가 있는 이벤트 편집 시 repeatCount가 설정되고 repeatEndDate는 빈 문자열이어야 한다', () => {
    const eventWithCount: Event = {
      id: '2',
      title: '횟수 종료 이벤트',
      date: '2025-02-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      notificationTime: 10,
      repeat: { type: 'daily', interval: 1, count: 7 },
    };
    const { result } = renderHook(() => useEventForm(eventWithCount));
    expect(result.current.repeatCount).toBe(7);
    expect(result.current.repeatEndDate).toBe('');
  });

  it('endDate와 count가 모두 있는 이벤트 편집 시 (정책: endDate 우선), repeatEndDate가 설정되고 count는 무시(undefined)된다', () => {
    const eventWithBoth: Event = {
      id: '3',
      title: '둘 다 있는 이벤트',
      date: '2025-03-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      notificationTime: 10,
      repeat: { type: 'daily', interval: 1, endDate: '2025-03-05', count: 3 }, // endDate 우선
    };
    const { result } = renderHook(() => useEventForm(eventWithBoth));
    expect(result.current.repeatEndDate).toBe('2025-03-05');
    expect(result.current.repeatCount).toBeUndefined(); // count는 초기화되거나 무시됨
  });

  // 폼 리셋
  it('resetForm 호출 시 repeatEndDate와 repeatCount가 모두 초기화되어야 한다', () => {
    const { result } = renderHook(() => useEventForm());
    act(() => result.current.setRepeatEndDate('2025-12-31'));
    act(() => result.current.setRepeatCount(5)); // setRepeatCount가 endDate를 초기화할 것
    act(() => result.current.setRepeatEndDate('2025-11-30')); // 다시 endDate 설정

    act(() => {
      result.current.resetForm();
    });
    expect(result.current.repeatEndDate).toBe('');
    expect(result.current.repeatCount).toBeUndefined();
  });
});
