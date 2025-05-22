// src/__tests__/hooks/useEventForm.single.edit.spec.ts
import { act, renderHook } from '@testing-library/react';

import { useEventForm } from '../../hooks/useEventForm';
import { Event } from '../../types';

describe('useEventForm - 반복 일정 단일 수정 (올바른 UX)', () => {
  it('반복 일정을 편집 모드로 로드하면 기존 반복 설정이 그대로 표시되어야 한다', () => {
    const repeatingEvent: Event = {
      id: 'repeat-event-1',
      title: '주간 회의',
      date: '2025-05-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '매주 진행되는 회의',
      location: '회의실',
      category: '업무',
      repeat: {
        type: 'weekly',
        interval: 1,
        id: 'repeat-group-1',
        endDate: '2025-05-31',
      },
      notificationTime: 10,
    };

    const { result } = renderHook(() => useEventForm(repeatingEvent));

    // 편집 모드에서는 기존 반복 설정이 그대로 표시되어야 함
    expect(result.current.isRepeating).toBe(true);
    expect(result.current.repeatType).toBe('weekly');
    expect(result.current.repeatInterval).toBe(1);
    expect(result.current.repeatEndDate).toBe('2025-05-31');
  });

  it('반복 일정 편집 시 createRepeatInfo는 단일 일정 정보를 반환해야 한다', () => {
    const repeatingEvent: Event = {
      id: 'repeat-event-1',
      title: '주간 회의',
      date: '2025-05-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '매주 진행되는 회의',
      location: '회의실',
      category: '업무',
      repeat: {
        type: 'weekly',
        interval: 2,
        id: 'repeat-group-1',
        maxOccurrences: 5,
      },
      notificationTime: 10,
    };

    const { result } = renderHook(() => useEventForm());

    // editEvent를 호출해야 editingEvent가 설정됨
    act(() => {
      result.current.editEvent(repeatingEvent);
    });

    // UI에는 기존 설정이 표시되지만
    expect(result.current.isRepeating).toBe(true);
    expect(result.current.repeatType).toBe('weekly');
    expect(result.current.repeatInterval).toBe(2);
    expect(result.current.repeatMaxOccurrences).toBe(5);

    // 저장할 때는 단일 일정으로 변경
    const repeatInfo = result.current.createRepeatInfo();
    expect(repeatInfo.type).toBe('none');
    expect(repeatInfo.interval).toBe(1);
    expect(repeatInfo.id).toBeUndefined();
    expect(repeatInfo.maxOccurrences).toBeUndefined();
  });

  it('기존 단일 일정을 편집할 때는 기존 동작이 그대로 유지되어야 한다', () => {
    const singleEvent: Event = {
      id: 'single-event-1',
      title: '개인 약속',
      date: '2025-05-01',
      startTime: '14:00',
      endTime: '15:00',
      description: '친구와 만남',
      location: '카페',
      category: '개인',
      repeat: {
        type: 'none',
        interval: 1,
      },
      notificationTime: 5,
    };

    const { result } = renderHook(() => useEventForm(singleEvent));

    // 단일 일정은 편집 모드에서도 그대로 유지
    expect(result.current.isRepeating).toBe(false);
    expect(result.current.repeatType).toBe('none');

    const repeatInfo = result.current.createRepeatInfo();
    expect(repeatInfo.type).toBe('none');
  });
});
