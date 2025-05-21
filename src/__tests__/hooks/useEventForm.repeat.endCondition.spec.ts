// src/__tests__/hooks/useEventForm.repeat.endCondition.spec.ts
import { act, renderHook } from '@testing-library/react';

import { useEventForm } from '../../hooks/useEventForm';
import { Event } from '../../types';

// 상수를 테스트 파일 상단에 정의
const DEFAULT_MAX_OCCURRENCES = 10;
const DEFAULT_END_DATE = '2025-09-30';

describe('useEventForm - 반복 종료 조건', () => {
  it('초기 반복 종료 유형은 "date"(날짜 지정)여야 한다', () => {
    const { result } = renderHook(() => useEventForm());
    expect(result.current.repeatEndType).toBe('date');
  });

  it('반복 종료 유형을 "count"로 변경하면 repeatEndType과 관련 상태들이 올바르게 변경되어야 한다', () => {
    const { result } = renderHook(() => useEventForm());

    // 일단 종료일을 설정
    act(() => {
      result.current.setRepeatEndDate('2025-05-10');
    });

    // 종료 조건을 횟수로 변경
    act(() => {
      result.current.setRepeatEndType('count');
    });

    // 종료 유형이 변경되고 종료일이 초기화됨
    expect(result.current.repeatEndType).toBe('count');
    expect(result.current.repeatEndDate).toBe('');
    expect(result.current.repeatMaxOccurrences).toBe(10); // 기본값

    // 횟수를 5로 설정
    act(() => {
      result.current.setRepeatMaxOccurrences(5);
    });
    expect(result.current.repeatMaxOccurrences).toBe(5);

    // 다시 종료일로 변경
    act(() => {
      result.current.setRepeatEndType('date');
    });

    // 반복 횟수가 초기화됨
    expect(result.current.repeatEndType).toBe('date');
    expect(result.current.repeatMaxOccurrences).toBeUndefined(); // 초기화됨
  });

  it('createRepeatInfo 함수는 모든 종료 조건 시나리오에서 적절한 RepeatInfo를 반환해야 한다', () => {
    const { result } = renderHook(() => useEventForm());

    // 반복 설정
    act(() => {
      result.current.setIsRepeating(true);
      result.current.setRepeatType('daily');
      result.current.setRepeatInterval(1);
    });

    // 시나리오 1: 날짜 종료 조건 (날짜 있음)
    act(() => {
      result.current.setRepeatEndType('date');
      result.current.setRepeatEndDate('2025-05-10');
    });

    let repeatInfo = result.current.createRepeatInfo();
    expect(repeatInfo.type).toBe('daily');
    expect(repeatInfo.interval).toBe(1);
    expect(repeatInfo.endDate).toBe('2025-05-10');
    expect(repeatInfo.maxOccurrences).toBeUndefined();
    expect(repeatInfo.id).toBeUndefined(); // id는 포함되지 않아야 함

    // 시나리오 2: 날짜 종료 조건 (날짜 없음 - 기본값 사용)
    act(() => {
      result.current.setRepeatEndDate('');
    });

    repeatInfo = result.current.createRepeatInfo();
    expect(repeatInfo.endDate).toBe(DEFAULT_END_DATE); // 상수 사용
    expect(repeatInfo.maxOccurrences).toBeUndefined();

    // 시나리오 3: 횟수 종료 조건 (횟수 있음)
    act(() => {
      result.current.setRepeatEndType('count');
      result.current.setRepeatMaxOccurrences(5);
    });

    repeatInfo = result.current.createRepeatInfo();
    expect(repeatInfo.type).toBe('daily');
    expect(repeatInfo.interval).toBe(1);
    expect(repeatInfo.endDate).toBe(DEFAULT_END_DATE); // 상수 사용
    expect(repeatInfo.maxOccurrences).toBe(5);
    expect(repeatInfo.id).toBeUndefined();

    // 시나리오 4: 횟수 종료 조건 (횟수 없음 - 기본값 사용)
    act(() => {
      result.current.setRepeatMaxOccurrences(undefined);
    });

    repeatInfo = result.current.createRepeatInfo();
    expect(repeatInfo.endDate).toBe(DEFAULT_END_DATE);
    expect(repeatInfo.maxOccurrences).toBe(DEFAULT_MAX_OCCURRENCES); // 상수 사용

    // 시나리오 5: 종료 없음 조건
    act(() => {
      result.current.setRepeatEndType('never');
    });

    repeatInfo = result.current.createRepeatInfo();
    expect(repeatInfo.type).toBe('daily');
    expect(repeatInfo.interval).toBe(1);
    expect(repeatInfo.endDate).toBe(DEFAULT_END_DATE); // 상수 사용
    expect(repeatInfo.maxOccurrences).toBeUndefined();
    expect(repeatInfo.id).toBeUndefined();
  });

  // 추가 테스트: setRepeatMaxOccurrences의 다양한 입력 처리
  it('setRepeatMaxOccurrences는 다양한 입력값을 안전하게 처리해야 한다', () => {
    const { result } = renderHook(() => useEventForm());

    // 시나리오 1: 정상적인 숫자 설정
    act(() => {
      result.current.setRepeatMaxOccurrences(5);
    });
    expect(result.current.repeatMaxOccurrences).toBe(5);

    // 시나리오 2: 문자열 입력 처리
    act(() => {
      result.current.setRepeatMaxOccurrences('8');
    });
    expect(result.current.repeatMaxOccurrences).toBe(8);

    // 시나리오 3: 소수점 처리 (정수로 내림)
    act(() => {
      result.current.setRepeatMaxOccurrences(7.8);
    });
    expect(result.current.repeatMaxOccurrences).toBe(7);

    // 시나리오 4: 0이나 음수 처리 (기본값으로 설정)
    act(() => {
      result.current.setRepeatMaxOccurrences(0);
    });
    expect(result.current.repeatMaxOccurrences).toBe(DEFAULT_MAX_OCCURRENCES);

    act(() => {
      result.current.setRepeatMaxOccurrences(-3);
    });
    expect(result.current.repeatMaxOccurrences).toBe(DEFAULT_MAX_OCCURRENCES);

    // 시나리오 5: 빈 문자열 처리
    act(() => {
      result.current.setRepeatMaxOccurrences('');
    });
    expect(result.current.repeatMaxOccurrences).toBeUndefined();

    // 시나리오 6: undefined 처리
    act(() => {
      result.current.setRepeatMaxOccurrences(undefined);
    });
    expect(result.current.repeatMaxOccurrences).toBeUndefined();
  });

  it('기존 이벤트 편집 시 종료 조건 정보가 적절히 로드되어야 한다', () => {
    // 날짜 종료 조건이 있는 이벤트
    const eventWithEndDate: Event = {
      id: '1',
      title: '회의',
      date: '2025-05-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: {
        type: 'weekly',
        interval: 1,
        endDate: '2025-05-31',
      },
      notificationTime: 10,
    };

    const { result: result1 } = renderHook(() => useEventForm(eventWithEndDate));
    expect(result1.current.repeatEndType).toBe('date');
    expect(result1.current.repeatEndDate).toBe('2025-05-31');
    expect(result1.current.repeatMaxOccurrences).toBeUndefined(); // date 타입이므로 undefined

    // 횟수 종료 조건이 있는 이벤트
    const eventWithMaxOccurrences: Event = {
      id: '2',
      title: '회의',
      date: '2025-05-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: {
        type: 'weekly',
        interval: 1,
        maxOccurrences: 5,
        endDate: '2025-09-30', // 안전장치로 기본 종료일도 함께 저장됨
      },
      notificationTime: 10,
    };

    const { result: result2 } = renderHook(() => useEventForm(eventWithMaxOccurrences));
    expect(result2.current.repeatEndType).toBe('count');
    expect(result2.current.repeatEndDate).toBe('');
    expect(result2.current.repeatMaxOccurrences).toBe(5);

    // 종료 조건이 없는 이벤트
    const eventWithNoEndCondition: Event = {
      id: '3',
      title: '회의',
      date: '2025-05-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: {
        type: 'weekly',
        interval: 1,
      },
      notificationTime: 10,
    };

    const { result: result3 } = renderHook(() => useEventForm(eventWithNoEndCondition));
    expect(result3.current.repeatEndType).toBe('never');
    expect(result3.current.repeatEndDate).toBe('');
    expect(result3.current.repeatMaxOccurrences).toBeUndefined();
  });
});
