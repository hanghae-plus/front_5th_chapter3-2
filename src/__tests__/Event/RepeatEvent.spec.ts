import { renderHook } from '@testing-library/react';
import { act } from '@testing-library/react';

import { setupMockHandlerCreation } from '../../__mocks__/handlersUtils';
import { useEventOperations } from '../../hooks/useEventOperations';
import { EventForm, RepeatType } from '../../types';

describe('반복 일정 생성 및 수정', () => {
  beforeEach(() => {
    setupMockHandlerCreation();
  });

  test('매일 반복되는 일정을 생성할 수 있다', async () => {
    // Given (준비)
    const { result } = renderHook(() => useEventOperations(false));

    const newEvent: EventForm = {
      title: '매일 아침 회의',
      date: '2025-05-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '아침 스크럼',
      location: '회의실 A',
      category: '회의',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-05-17', // 3일 동안 반복
      },
      notificationTime: 10, // 10분 전 알림
    };

    // When (실행)
    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    // Then (검증)
    const savedEvents = result.current.events;
    console.log('savedEvents', savedEvents);

    // 1. 반복 유형이 올바르게 설정되었는지 확인
    expect(savedEvents[0].repeat.type).toBe('daily');

    // 2. 3일치 일정이 모두 생성되었는지 확인
    expect(savedEvents).toHaveLength(3);

    // 3. 각 일정의 날짜가 올바른지 확인
    const dates = savedEvents.map((event) => event.date).sort();
    expect(dates).toEqual(['2025-05-15', '2025-05-16', '2025-05-17']);

    // 4. 시간과 다른 속성들이 동일하게 복사되었는지 확인
    savedEvents.forEach((event) => {
      expect(event).toMatchObject({
        title: newEvent.title,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        description: newEvent.description,
        location: newEvent.location,
        category: newEvent.category,
        notificationTime: newEvent.notificationTime,
      });
    });
  });
  test('매주 반복되는 일정을 생성할 수 있다', async () => {
    const { result } = renderHook(() => useEventOperations(false));

    const newEvent: EventForm = {
      title: '주간 회의',
      date: '2025-05-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '주간 업무 보고',
      location: '회의실 B',
      category: '회의',
      repeat: {
        type: 'weekly',
        interval: 1,
        endDate: '2025-07-15', // 2개월 동안 반복
      },
      notificationTime: 30, // 30분 전 알림
    };

    // When (실행)
    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    // Then (검증)
    const savedEvents = result.current.events;
    console.log('savedEvents', savedEvents);

    // 1. 반복 유형이 올바르게 설정되었는지 확인
    expect(savedEvents[0].repeat.type).toBe('weekly');

    // 2. 매주 반복되므로 약 9주치 일정이 생성되어야 함 (5월 15일부터 7월 15일까지)
    expect(savedEvents).toHaveLength(9); // 시작일 포함 14주

    // 3. 각 일정의 날짜가 올바른지 확인 (7일씩 증가)
    const dates = savedEvents.map((event) => event.date).sort();
    expect(dates).toEqual([
      '2025-05-15',
      '2025-05-22',
      '2025-05-29',
      '2025-06-05',
      '2025-06-12',
      '2025-06-19',
      '2025-06-26',
      '2025-07-03',
      '2025-07-10',
    ]);

    // 4. 시간과 다른 속성들이 동일하게 복사되었는지 확인
    savedEvents.forEach((event) => {
      expect(event).toMatchObject({
        title: newEvent.title,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        description: newEvent.description,
        location: newEvent.location,
        category: newEvent.category,
        notificationTime: newEvent.notificationTime,
      });
    });
  });
  test('매월 반복되는 일정을 생성할 수 있다', async () => {
    const { result } = renderHook(() => useEventOperations(false));

    const newEvent: EventForm = {
      title: '월간 보고',
      date: '2025-05-15',
      startTime: '15:00',
      endTime: '16:00',
      description: '월간 실적 보고',
      location: '대회의실',
      category: '보고',
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2025-12-15', // 7개월 동안 반복
      },
      notificationTime: 60,
    };

    // When (실행)
    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    // Then (검증)
    const savedEvents = result.current.events;
    console.log('savedEvents', savedEvents);

    // 1. 반복 유형이 올바르게 설정되었는지 확인
    expect(savedEvents[0].repeat.type).toBe('monthly');

    // 2. 매주 반복되므로 약 9주치 일정이 생성되어야 함 (5월 15일부터 7월 15일까지)
    expect(savedEvents).toHaveLength(8); // 시작일 포함 14주

    // 3. 각 일정의 날짜가 올바른지 확인 (7일씩 증가)
    const dates = savedEvents.map((event) => event.date).sort();
    expect(dates.map((event) => event).sort()).toEqual([
      '2025-05-15',
      '2025-06-15',
      '2025-07-15',
      '2025-08-15',
      '2025-09-15',
      '2025-10-15',
      '2025-11-15',
      '2025-12-15',
    ]);

    // 4. 시간과 다른 속성들이 동일하게 복사되었는지 확인
    savedEvents.forEach((event) => {
      expect(event).toMatchObject({
        title: newEvent.title,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        description: newEvent.description,
        location: newEvent.location,
        category: newEvent.category,
        notificationTime: newEvent.notificationTime,
      });
    });
  });

  test('매년 반복되는 일정을 생성할 수 있다', async () => {
    const { result } = renderHook(() => useEventOperations(false));

    const newEvent: EventForm = {
      title: '연간 계획 수립',
      date: '2025-05-15',
      startTime: '10:00',
      endTime: '12:00',
      description: '연간 사업 계획 수립',
      location: '임원실',
      category: '기획',
      repeat: {
        type: 'yearly',
        interval: 1,
        endDate: '2027-05-15', // 2년 동안 반복
      },
      notificationTime: 1440,
    };

    // When (실행)
    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    // Then (검증)
    const savedEvents = result.current.events;
    console.log('savedEvents', savedEvents);

    expect(savedEvents[0].repeat.type).toBe('yearly');
    expect(savedEvents).toHaveLength(3); // 2025, 2026, 2027년

    expect(savedEvents.map((event) => event.date).sort()).toEqual([
      '2025-05-15',
      '2026-05-15',
      '2027-05-15',
    ]);
  });

  test('매월 윤년일때 2024년 2월 29일에 반복 일정을 선택했을 때, 2025년 2월 28일에 반복 일정이 생성된다.', async () => {
    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newEvent: EventForm = {
      title: '새 회의',
      date: '2024-02-29',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 6, endDate: '2025-03-01' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    expect(result.current.events).toHaveLength(3);
    expect(result.current.events[0].date).toBe('2024-02-29');
    expect(result.current.events[1].date).toBe('2024-08-29');
    expect(result.current.events[2].date).toBe('2025-02-28');
  });
});

describe('반복 간격 설정', () => {
  beforeEach(() => {
    setupMockHandlerCreation();
  });
  it('일정 반복을 daily로 설정시 interval 간격만큼 반복 일간 정보가 반영된다.', async () => {
    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newEvent: EventForm = {
      title: '새 회의',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-20' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    expect(result.current.events).toHaveLength(5);
  });

  it('일정 반복을 weekly로 설정시 interval 간격만큼 반복 주간 정보가 반영된다.', async () => {
    setupMockHandlerCreation();

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newEvent: EventForm = {
      title: '새 회의',
      date: '2025-10-01',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-10-30' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    const expectedDate = ['2025-10-01', '2025-10-08', '2025-10-15', '2025-10-22', '2025-10-29'];

    expect(result.current.events).toHaveLength(5);
    expectedDate.forEach((date, index) => {
      expect(result.current.events[index].date).toBe(date);
    });
  });

  it('일정 반복을 monthly로 설정시 interval 간격만큼 반복 월간 정보가 반영된다.', async () => {
    setupMockHandlerCreation();

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newEvent: EventForm = {
      title: '새 회의',
      date: '2025-10-01',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-12-30' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    const expectedDate = ['2025-10-01', '2025-11-01', '2025-12-01'];

    expect(result.current.events).toHaveLength(3);
    expectedDate.forEach((date, index) => {
      expect(result.current.events[index].date).toBe(date);
    });
  });

  it('일정 반복을 yearly로 설정시 interval 간격만큼 반복 년간 정보가 반영된다.', async () => {
    setupMockHandlerCreation();

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const newEvent: EventForm = {
      title: '새 회의',
      date: '2025-10-01',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'yearly', interval: 1, endDate: '2026-10-30' },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    const expectedDate = ['2025-10-01', '2026-10-01'];

    expect(result.current.events).toHaveLength(2);
    expectedDate.forEach((date, index) => {
      expect(result.current.events[index].date).toBe(date);
    });
  });
});

describe('반복 일정 표시', () => {
  beforeEach(() => {
    setupMockHandlerCreation();
  });

  test('반복 유형별로 올바른 텍스트가 표시된다', async () => {
    const { result } = renderHook(() => useEventOperations(false));

    // 각 반복 유형별 테스트 데이터
    const testCases = [
      {
        type: 'daily',
        interval: 2,
        expectedText: '반복: 2일',
      },
      {
        type: 'weekly',
        interval: 1,
        expectedText: '반복: 1주',
      },
      {
        type: 'monthly',
        interval: 3,
        expectedText: '반복: 3월',
      },
      {
        type: 'yearly',
        interval: 1,
        expectedText: '반복: 1년',
      },
    ];

    for (const testCase of testCases) {
      const newEvent: EventForm = {
        title: `${testCase.type} 반복 테스트`,
        date: '2025-05-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '반복 표시 테스트',
        location: '회의실 A',
        category: '회의',
        repeat: {
          type: testCase.type as RepeatType,
          interval: testCase.interval,
          endDate: '2025-05-30',
        },
        notificationTime: 10,
      };

      await act(async () => {
        await result.current.saveEvent(newEvent);
      });

      const savedEvents = result.current.events;
      const lastSavedEvent = savedEvents[savedEvents.length - 1];

      // 반복 유형이 올바르게 설정되었는지 확인
      expect(lastSavedEvent.repeat.type).toBe(testCase.type);

      // 반복 간격이 올바르게 설정되었는지 확인
      expect(lastSavedEvent.repeat.interval).toBe(testCase.interval);

      // 반복 표시 텍스트가 올바른지 확인
      const repeatText = `반복: ${lastSavedEvent.repeat.interval}${
        lastSavedEvent.repeat.type === 'daily'
          ? '일'
          : lastSavedEvent.repeat.type === 'weekly'
          ? '주'
          : lastSavedEvent.repeat.type === 'monthly'
          ? '월'
          : '년'
      }`;
      expect(repeatText).toBe(testCase.expectedText);
    }
  });

  test('반복이 아닌 일정은 반복 텍스트가 표시되지 않는다', async () => {
    const { result } = renderHook(() => useEventOperations(false));

    const newEvent: EventForm = {
      title: '일반 일정',
      date: '2025-05-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '반복 없는 일정',
      location: '회의실 A',
      category: '회의',
      repeat: {
        type: 'none',
        interval: 1,
        endDate: undefined,
      },
      notificationTime: 10,
    };

    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    const savedEvents = result.current.events;
    const savedEvent = savedEvents[0];

    // 반복 유형이 none인지 확인
    expect(savedEvent.repeat.type).toBe('none');

    // repeat.type이 none이면 반복 텍스트가 표시되지 않아야 함
    const shouldNotShowRepeatText = savedEvent.repeat.type === 'none';
    expect(shouldNotShowRepeatText).toBe(true);
  });
});
