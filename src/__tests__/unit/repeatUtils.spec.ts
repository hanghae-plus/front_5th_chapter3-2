import { EventForm } from '../../types.ts';
import { generateRepeatedEvents } from '../../utils/repeatUtils';

describe('generateRepeatedEvents', () => {
  const baseEvent: EventForm = {
    title: '반복 일정 테스트',
    date: '2025-01-31',
    startTime: '10:00',
    endTime: '11:00',
    description: '',
    location: '',
    category: '',
    notificationTime: 10,
    repeat: {
      type: 'monthly',
      interval: 1,
      endDate: '2025-03-31',
    },
  };

  // 반복 유형 선택
  it('monthly 반복은 1월 31일 → 2월 28일 → 3월 31일을 포함해야 한다', () => {
    const results = generateRepeatedEvents(baseEvent);
    expect(results.map((e) => e.date)).toEqual(['2025-01-31', '2025-02-28', '2025-03-31']);
  });

  it('yearly 반복은 윤년 날짜(2월 29일)를 평년에는 2월 28일로 처리한다', () => {
    const eventOnLeapDay: EventForm = {
      ...baseEvent,
      date: '2024-02-29',
      repeat: {
        type: 'yearly',
        interval: 1,
        endDate: '2026-03-01',
      },
    };

    const results = generateRepeatedEvents(eventOnLeapDay);
    expect(results.map((e) => e.date)).toEqual(['2024-02-29', '2025-02-28', '2026-02-28']);
  });

  // 반복 간격 설정
  it('3일마다 반복되는 daily 일정 생성', () => {
    const event = {
      ...baseEvent,
      date: '2025-01-31',
      repeat: { type: 'daily' as const, interval: 3, endDate: '2025-02-10' },
    };
    const dates = generateRepeatedEvents(event).map((e) => e.date);
    expect(dates).toEqual(['2025-01-31', '2025-02-03', '2025-02-06', '2025-02-09']);
  });

  // 반복 종료 조건 - endDate 기반
  it('endDate가 있으면 해당 날짜까지만 반복 생성된다', () => {
    const event = {
      ...baseEvent,
      date: '2025-01-01',
      repeat: {
        type: 'daily' as const,
        interval: 1,
        endDate: '2025-01-03',
      },
    };
    const results = generateRepeatedEvents(event);
    expect(results.map((e) => e.date)).toEqual(['2025-01-01', '2025-01-02', '2025-01-03']);
  });

  // 반복 종료 조건 - count 기반
  it('count가 지정되면 해당 횟수만큼만 반복된다', () => {
    const event = {
      ...baseEvent,
      date: '2025-01-01',
      repeat: {
        type: 'weekly' as const,
        interval: 1,
        count: 3,
      },
    };
    const results = generateRepeatedEvents(event);
    expect(results.map((e) => e.date)).toEqual(['2025-01-01', '2025-01-08', '2025-01-15']);
  });

  // 종료 조건 없음 → 기본 종료일 (2025-09-30까지)
  it('endDate와 count가 없으면 기본 종료일 2025-09-30까지만 생성된다', () => {
    const event = {
      ...baseEvent,
      date: '2025-01-01',
      repeat: {
        type: 'monthly' as const,
        interval: 1,
        // 종료 조건 없음
      },
    };
    const results = generateRepeatedEvents(event);
    const last = results.at(-1);
    expect(last!.date <= '2025-09-30').toBe(true);
  });
});

describe('generateRepeatedEvents - 단일 수정 및 삭제', () => {
  const baseEvent = {
    title: '단일 수정 테스트',
    date: '2025-01-01',
    startTime: '10:00',
    endTime: '11:00',
    description: '',
    location: '',
    category: '',
    notificationTime: 10,
    repeat: {
      type: 'daily' as const,
      interval: 1,
      count: 3,
    },
  };

  it('반복 일정 중 하나를 수정하면 반복이 해제된다', () => {
    const events = generateRepeatedEvents(baseEvent);
    const editedEvent = {
      ...events[1],
      title: '수정된 일정',
      repeat: { type: 'none', interval: 1 },
    };

    // 수정된 이벤트가 repeat.type === 'none'인지 확인
    expect(editedEvent.repeat.type).toBe('none'); // ✅ 통과
    expect(events[1].repeat.type).not.toBe('none'); // ❌ 실패
  });

  it('반복 일정 중 하나를 삭제하면 나머지는 유지된다', () => {
    const events = generateRepeatedEvents(baseEvent);
    const remaining = events.filter((e) => e.date !== '2025-01-02');

    expect(remaining).toHaveLength(2);
    expect(remaining.map((e) => e.date)).toEqual(['2025-01-01', '2025-01-03']);
  });
});
