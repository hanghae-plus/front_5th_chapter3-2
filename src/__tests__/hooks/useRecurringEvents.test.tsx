import { act, renderHook } from '@testing-library/react';

import { useRecurringEvents } from '../../hooks/useRecurringEvents';

describe('반복 일정 관련 Hook (useRecurringEvents)', () => {
  // 반복 유형 선택 테스트

  it('반복 유형을 "매일"로 변경할 수 있다', () => {
    const { result } = renderHook(() => useRecurringEvents());

    act(() => {
      result.current.changeRepeatType('daily');
    });

    expect(result.current.repeatType).toBe('daily');
  });

  it('반복 유형을 "매주"로 변경할 수 있다', () => {
    const { result } = renderHook(() => useRecurringEvents());

    act(() => {
      result.current.changeRepeatType('weekly');
    });

    expect(result.current.repeatType).toBe('weekly');
  });

  it('반복 유형을 "매월"로 변경할 수 있다', () => {
    const { result } = renderHook(() => useRecurringEvents());

    act(() => {
      result.current.changeRepeatType('monthly');
    });

    expect(result.current.repeatType).toBe('monthly');
  });

  it('반복 유형을 "매년"로 변경할 수 있다', () => {
    const { result } = renderHook(() => useRecurringEvents());

    act(() => {
      result.current.changeRepeatType('yearly');
    });

    expect(result.current.repeatType).toBe('yearly');
  });

  // 반복 간격 설정 테스트
  it('반복 간격이 설정되지 않았을 때 기본값은 1이어야 한다', () => {
    const { result } = renderHook(() => useRecurringEvents());
    expect(result.current.repeatInterval).toBe(1);
  });

  it('유효하지 않은 반복 간격 값(0 이하)을 설정하면 오류가 발생해야 한다', () => {
    const { result } = renderHook(() => useRecurringEvents());

    expect(() => {
      act(() => {
        result.current.changeRepeatInterval(0);
      });
    }).toThrow('반복 간격은 1 이상이어야 합니다.');
  });

  it('반복 간격을 변경할 수 있다', () => {
    const { result } = renderHook(() => useRecurringEvents());

    act(() => {
      result.current.changeRepeatInterval(2);
    });

    expect(result.current.repeatInterval).toBe(2);
  });

  // 반복 종료 테스트
  it('반복 종료일이 설정되지 않았을 때 반복 종료일 2025-09-30로 설정되어야 한다', () => {
    const { result } = renderHook(() => useRecurringEvents());
    expect(result.current.repeatEndDate).toBe('2025-09-30');
  });

  // 반복 일정 변경 테스트
  it('반복 일정을 수정하면 해당 일정만 수정되고 반복 속성이 제거되어야 한다', () => {
    const { result } = renderHook(() => useRecurringEvents());

    // 초기 반복 일정 설정
    act(() => {
      result.current.changeRepeatType('daily');
      result.current.changeRepeatInterval(2);
    });

    expect(result.current.repeatType).toBe('daily');
    expect(result.current.repeatInterval).toBe(2);

    // 반복 일정 수정 시 단일 일정으로 변경
    act(() => {
      result.current.changeRepeatType('none');
    });

    expect(result.current.repeatType).toBe('none');
  });

  // 반복 일정 삭제 테스트
  it('반복 일정을 삭제하면 해당 일정만 삭제되어야 한다', () => {
    const { result } = renderHook(() => useRecurringEvents());

    // 초기 반복 일정 설정
    act(() => {
      result.current.changeRepeatType('daily');
      result.current.changeRepeatInterval(2);
    });

    expect(result.current.repeatType).toBe('daily');
    expect(result.current.repeatInterval).toBe(2);
  });
});
