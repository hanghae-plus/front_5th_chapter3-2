import { renderHook } from '@testing-library/react';

import { useRecurrentEventDisplay } from '../../hooks/useRecurrentEventDisplay';
import { Event, RepeatType } from '../../types';

describe('반복 일정 표시 관련 Hook (useRecurrentEventDisplay)', () => {
  const mockEvent: Event = {
    id: '1',
    title: '테스트 일정',
    date: '2024-03-20',
    startTime: '09:00',
    endTime: '10:00',
    description: '테스트 설명',
    location: '테스트 장소',
    category: '업무',
    repeat: {
      type: 'daily' as RepeatType,
      interval: 2,
      endDate: '2024-04-20',
    },
    notificationTime: 10,
  };

  // 반복 일정 표시 테스트
  it('반복 일정에는 🔁 아이콘이 표시되어야 한다', () => {
    const { result } = renderHook(() => useRecurrentEventDisplay());

    const repeatEvent = { ...mockEvent };
    const nonRepeatEvent = { ...mockEvent, repeat: { type: 'none' as RepeatType, interval: 1 } };

    expect(result.current.getRecurrentIcon(repeatEvent)).toBe('🔁');
    expect(result.current.getRecurrentIcon(nonRepeatEvent)).toBe('');
  });

  // 반복 종료 표시 테스트
  it('종료 날짜가 있는 반복 일정은 해당 종료일까지만 표시되어야 한다', () => {
    const { result } = renderHook(() => useRecurrentEventDisplay());

    const event = {
      ...mockEvent,
      date: '2024-03-01',
      repeat: {
        type: 'daily' as RepeatType,
        interval: 1,
        endDate: '2024-03-10',
      },
    };

    // 종료일 이전
    expect(result.current.shouldDisplayRecurrentEvent(event, '2024-03-05')).toBe(true);
    // 종료일
    expect(result.current.shouldDisplayRecurrentEvent(event, '2024-03-10')).toBe(true);
    // 종료일 이후
    expect(result.current.shouldDisplayRecurrentEvent(event, '2024-03-11')).toBe(false);
  });

  it('반복 횟수가 제한된 일정은 지정된 횟수만큼만 표시되어야 한다', () => {
    const { result } = renderHook(() => useRecurrentEventDisplay());

    const event = {
      ...mockEvent,
      date: '2024-03-01',
      repeat: {
        type: 'weekly' as RepeatType,
        interval: 1,
        endDate: '2024-03-29', // 4주 동안만 반복
      },
    };

    // 시작일
    expect(result.current.shouldDisplayRecurrentEvent(event, '2024-03-01')).toBe(true);
    // 1주 후
    expect(result.current.shouldDisplayRecurrentEvent(event, '2024-03-08')).toBe(true);
    // 2주 후
    expect(result.current.shouldDisplayRecurrentEvent(event, '2024-03-15')).toBe(true);
    // 3주 후
    expect(result.current.shouldDisplayRecurrentEvent(event, '2024-03-22')).toBe(true);
    // 4주 후 (종료일 이후)
    expect(result.current.shouldDisplayRecurrentEvent(event, '2024-03-30')).toBe(false);
  });

  it('반복 유형에 따라 올바른 간격 단위가 표시되어야 한다', () => {
    const { result } = renderHook(() => useRecurrentEventDisplay());

    const weeklyEvent: Event = {
      ...mockEvent,
      repeat: { type: 'weekly' as RepeatType, interval: 1 },
    };
    const monthlyEvent: Event = {
      ...mockEvent,
      repeat: { type: 'monthly' as RepeatType, interval: 3 },
    };
    const yearlyEvent: Event = {
      ...mockEvent,
      repeat: { type: 'yearly' as RepeatType, interval: 1 },
    };

    expect(result.current.getRecurrentText(weeklyEvent)).toBe('반복: 1주마다');
    expect(result.current.getRecurrentText(monthlyEvent)).toBe('반복: 3월마다');
    expect(result.current.getRecurrentText(yearlyEvent)).toBe('반복: 1년마다');
  });

  // 단일 수정/삭제된 반복 일정 테스트
  it('단일 수정된 반복 일정은 반복 아이콘 없이 표시되어야 한다', () => {
    const { result } = renderHook(() => useRecurrentEventDisplay());

    const modifiedEvent = {
      ...mockEvent,
      repeat: { type: 'none' as RepeatType, interval: 1 }, // 수정 시 반복 속성 제거
    };

    expect(result.current.getRecurrentIcon(modifiedEvent)).toBe('');
    expect(result.current.shouldDisplayRecurrentEvent(modifiedEvent, modifiedEvent.date)).toBe(
      true
    );
  });
});
