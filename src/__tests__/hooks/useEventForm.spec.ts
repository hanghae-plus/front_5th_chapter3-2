import { renderHook, act } from '@testing-library/react';
import { ChangeEvent } from 'react';

import { useEventForm } from '../../hooks/useEventForm';

describe('useEventForm', () => {
  it('초기 반복 설정이 해제된 상태이다.', () => {
    const { result } = renderHook(() => useEventForm());

    expect(result.current.isRepeating).toBe(false);
    expect(result.current.repeatType).toBe('none');
  });

  it('반복 설정을 체크하면 반복 유형이 daily로 변경된다.', () => {
    const { result } = renderHook(() => useEventForm());

    act(() => {
      result.current.handleChangeIsRepeating({
        target: { checked: true },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.isRepeating).toBe(true);
    expect(result.current.repeatType).toBe('daily');
  });
});
