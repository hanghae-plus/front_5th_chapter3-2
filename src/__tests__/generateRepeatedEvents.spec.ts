import { RepeatType } from '../types';
import { generateRepeatedEvents } from '../utils/generateRepeatedEvents';

describe('generateRepeatedEvents', () => {
  const baseEvent = {
    title: '반복 테스트',
    date: '2025-01-31',
    startTime: '10:00',
    endTime: '11:00',
    description: '',
    location: '',
    category: '업무',
    notificationTime: 10,
    repeat: {
      type: 'monthly' as RepeatType,
      interval: 1,
      endDate: '2025-04-30',
    },
  };

  test('월별 반복 - 말일 보정 (1/31 → 2/28 → 3/31)', () => {
    const events = generateRepeatedEvents(baseEvent);
    expect(events.length).toBe(3);
    expect(events.map((e) => e.date)).toEqual(['2025-01-31', '2025-02-28', '2025-03-31']);
  });

  test('연도 반복 - 윤년 2/29 → 3/01로 보정됨', () => {
    const event = {
      ...baseEvent,
      date: '2024-02-29',
      repeat: { ...baseEvent.repeat, type: 'yearly' as RepeatType, endDate: '2026-12-31' },
    };
    const events = generateRepeatedEvents(event);
    expect(events.map((e) => e.date)).toEqual(['2024-02-29', '2025-02-28', '2026-02-28']);
  });

  test('횟수 제한이 적용되는 경우 count만큼 생성된다', () => {
    const event = {
      ...baseEvent,
      repeat: { ...baseEvent.repeat, count: 2 },
    };
    const events = generateRepeatedEvents(event);
    expect(events.length).toBe(2);
  });
});
