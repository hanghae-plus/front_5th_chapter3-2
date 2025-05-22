import { act, renderHook } from '@testing-library/react';

import { useEventForm } from '../../hooks/useEventForm';
import { RepeatType } from '../../types';

describe('useEventForm - 반복 유형 선택', () => {
  it('초기 반복 유형은 "none" 이어야 한다.', () => {
    const { result } = renderHook(() => useEventForm());
    expect(result.current.repeatType).toBe('none');
    expect(result.current.isRepeating).toBe(false);
  });

  it('반복 유형을 "daily"로 설정하면 repeatType이 "daily"로, isRepeating이 true로 변경되어야 한다.', () => {
    const { result } = renderHook(() => useEventForm());

    act(() => {
      result.current.setRepeatType('daily' as RepeatType);
    });

    expect(result.current.repeatType).toBe('daily');
    expect(result.current.isRepeating).toBe(true);
  });

  it('isRepeating을 true로 설정하면 기본 반복 유형(예: "daily")이 설정되고, false로 설정하면 "none"으로 변경되어야 한다.', () => {
    const { result } = renderHook(() => useEventForm());

    act(() => {
      result.current.setIsRepeating(true);
    });

    expect(result.current.repeatType).toBe('daily');
    expect(result.current.isRepeating).toBe(true);

    act(() => {
      result.current.setIsRepeating(false);
    });
    expect(result.current.repeatType).toBe('none');
    expect(result.current.isRepeating).toBe(false);
  });
});
