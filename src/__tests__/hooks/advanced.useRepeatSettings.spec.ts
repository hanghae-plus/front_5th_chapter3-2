import { act, renderHook } from '@testing-library/react';

import { useRepeatSettings } from '../../hooks/useRepeatSettings';
import { RepeatInfo } from '../../types';

describe('useRepeatSettings', () => {
  it('기존 일정에 반복 설정이 있으면 해당 값으로 초기화된다', () => {
    const initialEvent = {
      repeat: {
        type: 'weekly' as const,
        interval: 2,
        endDate: '2025-12-31',
      },
    };

    const { result } = renderHook(() => useRepeatSettings(initialEvent));

    expect(result.current.isRepeating).toBe(true);
    expect(result.current.repeatType).toBe('weekly');
    expect(result.current.repeatInterval).toBe(2);
    expect(result.current.repeatEndDate).toBe('2025-12-31');
  });

  it('반복 일정 설정을 켜고 끌 수 있다', () => {
    const { result } = renderHook(() => useRepeatSettings());

    act(() => {
      result.current.setIsRepeating(true);
    });

    expect(result.current.isRepeating).toBe(true);

    act(() => {
      result.current.setIsRepeating(false);
    });

    expect(result.current.isRepeating).toBe(false);
  });

  it('반복 간격을 설정할 수 있다', () => {
    const { result } = renderHook(() => useRepeatSettings());

    act(() => {
      result.current.setRepeatInterval(3);
    });

    expect(result.current.repeatInterval).toBe(3);
  });

  it('반복 종료 날짜를 설정할 수 있다', () => {
    const { result } = renderHook(() => useRepeatSettings());

    act(() => {
      result.current.setRepeatEndDate('2025-06-30');
    });

    expect(result.current.repeatEndDate).toBe('2025-06-30');
  });

  it('반복종료일이 없어도 반복 설정이 동작한다', () => {
    const initialEvent = {
      repeat: {
        type: 'daily' as const,
        interval: 1,
      },
    };

    const { result } = renderHook(() => useRepeatSettings(initialEvent));

    expect(result.current.isRepeating).toBe(true);
    expect(result.current.repeatType).toBe('daily');
    expect(result.current.repeatInterval).toBe(1);
    expect(result.current.repeatEndDate).toBe('');
  });

  it('반복 유형에 대해 올바르게 설정된다', () => {
    const { result } = renderHook(() => useRepeatSettings());

    const repeatTypes = ['daily', 'weekly', 'monthly', 'yearly'] as const;

    repeatTypes.forEach((type, index) => {
      act(() => {
        result.current.setRepeatType(type);
        result.current.setRepeatInterval(index + 1);
      });

      expect(result.current.isRepeating).toBe(true);
      expect(result.current.repeatType).toBe(type);
      expect(result.current.repeatInterval).toBe(index + 1);
    });
  });

  it('일정이 추가되면 반복에 대한 모든 설정이 초기값으로 리셋된다', () => {
    const initialEvent = {
      repeat: {
        type: 'monthly' as const,
        interval: 3,
        endDate: '2025-12-31',
      },
    };

    const { result } = renderHook(() => useRepeatSettings(initialEvent));

    // 초기값 확인
    expect(result.current.isRepeating).toBe(true);
    expect(result.current.repeatType).toBe('monthly');
    expect(result.current.repeatInterval).toBe(3);
    expect(result.current.repeatEndDate).toBe('2025-12-31');

    // 리셋 실행
    act(() => {
      result.current.resetRepeat();
    });

    // 리셋 후 확인
    expect(result.current.isRepeating).toBe(false);
    expect(result.current.repeatType).toBe('none');
    expect(result.current.repeatInterval).toBe(1);
    expect(result.current.repeatEndDate).toBe('');
  });

  it('반복 일정을 수정하면 주어진 설정으로 업데이트된다', () => {
    const { result } = renderHook(() => useRepeatSettings());

    const newSettings: RepeatInfo = {
      type: 'yearly',
      interval: 1,
      endDate: '2030-01-01',
    };

    act(() => {
      result.current.editRepeat(newSettings);
    });

    expect(result.current.isRepeating).toBe(true);
    expect(result.current.repeatType).toBe('yearly');
    expect(result.current.repeatInterval).toBe(1);
    expect(result.current.repeatEndDate).toBe('2030-01-01');
  });

  it('여러 설정을 순차적으로 변경해도 올바르게 동작한다', () => {
    const { result } = renderHook(() => useRepeatSettings());

    // 1단계: 주간 반복 설정
    act(() => {
      result.current.setRepeatType('weekly');
      result.current.setRepeatInterval(2);
    });

    expect(result.current.isRepeating).toBe(true);
    expect(result.current.repeatType).toBe('weekly');
    expect(result.current.repeatInterval).toBe(2);

    // 2단계: 종료 날짜 추가
    act(() => {
      result.current.setRepeatEndDate('2025-08-15');
    });

    expect(result.current.repeatEndDate).toBe('2025-08-15');

    // 3단계: 월간 반복으로 변경
    act(() => {
      result.current.setRepeatType('monthly');
      result.current.setRepeatInterval(1);
    });

    expect(result.current.repeatType).toBe('monthly');
    expect(result.current.repeatInterval).toBe(1);
    expect(result.current.repeatEndDate).toBe('2025-08-15'); // 기존 종료 날짜 유지

    // 4단계: 반복 비활성화
    act(() => {
      result.current.setIsRepeating(false);
    });

    expect(result.current.isRepeating).toBe(false);
    // 다른 설정들은 그대로 유지
    expect(result.current.repeatType).toBe('monthly');
    expect(result.current.repeatInterval).toBe(1);
    expect(result.current.repeatEndDate).toBe('2025-08-15');
  });
});
