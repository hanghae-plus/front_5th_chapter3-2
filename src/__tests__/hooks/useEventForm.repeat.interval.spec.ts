import { act, renderHook } from '@testing-library/react';

import { useEventForm } from '../../hooks/useEventForm';
import { Event } from '../../types';

describe('useEventForm - 반복 간격 설정', () => {
  it('초기 반복 간격은 1이어야 한다', () => {
    const { result } = renderHook(() => useEventForm());
    expect(result.current.repeatInterval).toBe(1);
  });

  it('반복 간격을 3으로 설정하면 repeatInterval이 3으로 변경되어야 한다', () => {
    const { result } = renderHook(() => useEventForm());

    act(() => {
      result.current.setRepeatInterval(3);
    });

    expect(result.current.repeatInterval).toBe(3);
  });

  it('반복 간격은 UI 레벨에서 1 미만으로 설정되지 않지만, 임시적으로 0을 허용한다', () => {
    // 처음엔 '반복 간격은 1 미만으로 설정할 수 없어야 한다'로 시나리오를 짯으나,
    // 1미만 값은 1이 무조건 1이 되게 되어서, ui에서 수정할 수 있게 변경
    // 통합테스트에서 ui 검증
    const { result } = renderHook(() => useEventForm());

    // 0 값 설정 시도
    act(() => {
      result.current.setRepeatInterval(0);
    });

    // 훅 내부에서는 0을 허용함 (UI에서 검증하기 전 상태)
    expect(result.current.repeatInterval).toBe(0);
  });

  it('기존 이벤트를 편집할 때 반복 간격 값이 정확하게 로드되어야 한다', () => {
    const existingEvent: Event = {
      id: '1',
      title: '기존 회의',
      date: '2025-05-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '회의',
      location: '회의실',
      category: '업무',
      repeat: {
        type: 'weekly',
        interval: 2, // 2주마다 반복
        id: 'test-repeat-id',
      },
      notificationTime: 10,
    };

    const { result } = renderHook(() => useEventForm(existingEvent));
    expect(result.current.repeatInterval).toBe(2);
  });
});
