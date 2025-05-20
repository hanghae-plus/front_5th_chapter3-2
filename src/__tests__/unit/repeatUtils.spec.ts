import { type Event } from '../../types';
import {
  generateRepeatDates,
  getRepeatTypeLabel,
  getRecurringTag,
  isRepeatEnded,
  convertRecurringToSingleEvent,
  deleteSingleOccurrence,
} from '../../utils/repeatUtils';

describe('getRepeatTypeLabel', () => {
  it('daily 타입에 대해 "매일"을 반환한다', () => {
    expect(getRepeatTypeLabel('daily')).toBe('매일');
  });

  it('weekly 타입에 대해 "매주"를 반환한다', () => {
    expect(getRepeatTypeLabel('weekly')).toBe('매주');
  });

  it('monthly 타입에 대해 "매월"을 반환한다', () => {
    expect(getRepeatTypeLabel('monthly')).toBe('매월');
  });

  it('yearly 타입에 대해 "매년"을 반환한다', () => {
    expect(getRepeatTypeLabel('yearly')).toBe('매년');
  });

  it('알 수 없는 타입에 대해 기본값 또는 "반복 없음"을 반환한다', () => {
    expect(getRepeatTypeLabel('unknown')).toBe('반복 없음');
  });
});

describe('generateRepeatDates', () => {
  it('매일 반복 일정을 올바르게 생성한다', () => {
    const result = generateRepeatDates('2025-07-01', {
      type: 'daily',
      interval: 1,
      endDate: '2025-07-03',
    });
    expect(result).toEqual(['2025-07-01', '2025-07-02', '2025-07-03']);
  });

  it('2주 간격의 반복 일정을 생성한다', () => {
    const result = generateRepeatDates('2025-07-01', {
      type: 'weekly',
      interval: 2,
      endDate: '2025-07-29',
    });
    expect(result).toEqual(['2025-07-01', '2025-07-15', '2025-07-29']);
  });

  it('윤년의 2월 29일에서 매년 반복 시 적절히 처리된다', () => {
    const result = generateRepeatDates('2024-02-29', {
      type: 'yearly',
      interval: 1,
      endDate: '2026-02-28',
    });
    expect(result).toEqual(['2024-02-29', '2025-02-28', '2026-02-28']);
  });

  it('매월 31일 반복이 30일 또는 말일로 조정된다', () => {
    const result = generateRepeatDates('2025-01-31', {
      type: 'monthly',
      interval: 1,
      endDate: '2025-03-31',
    });
    expect(result).toEqual(['2025-01-31', '2025-02-28', '2025-03-31']);
  });
});

describe('getRecurringTag', () => {
  it('반복 일정일 경우 반복 태그 문자열을 반환한다', () => {
    const event: Event = {
      id: '1',
      title: '반복 회의',
      date: '2025-07-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'weekly', interval: 1 },
      notificationTime: 10,
    };

    expect(getRecurringTag(event)).toBe('매주 반복');
  });

  it('반복이 아닌 일정일 경우 null을 반환한다', () => {
    const event: Event = {
      id: '2',
      title: '단일 회의',
      date: '2025-07-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };

    expect(getRecurringTag(event)).toBeNull();
  });
});

describe('isRepeatEnded', () => {
  it('현재 날짜가 종료일보다 전이면 false를 반환한다', () => {
    const result = isRepeatEnded('2025-07-01', '2025-07-31');
    expect(result).toBe(false);
  });

  it('현재 날짜가 종료일과 같으면 true를 반환한다', () => {
    const result = isRepeatEnded('2025-07-31', '2025-07-31');
    expect(result).toBe(true);
  });

  it('현재 날짜가 종료일보다 이후면 true를 반환한다', () => {
    const result = isRepeatEnded('2025-08-01', '2025-07-31');
    expect(result).toBe(true);
  });

  it('종료일이 undefined인 경우 false를 반환한다', () => {
    const result = isRepeatEnded('2025-07-01', undefined);
    expect(result).toBe(false);
  });
});

describe('convertRecurringToSingleEvent', () => {
  it('반복 이벤트를 단일 일정으로 변환한다', () => {
    const recurringEvent: Event = {
      id: '1',
      title: '반복 회의',
      date: '2025-07-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-09-01' },
      notificationTime: 10,
    };

    const result = convertRecurringToSingleEvent(recurringEvent);

    expect(result.repeat.type).toBe('none');
    expect(result.repeat.interval).toBe(0);
    expect(result.repeat.endDate).toBeUndefined();
  });

  it('repeat 필드를 완전히 초기화했는지 확인한다', () => {
    const event: Event = {
      id: '2',
      title: '테스트',
      date: '2025-07-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'monthly', interval: 2, endDate: '2025-12-01' },
      notificationTime: 5,
    };

    const updated = convertRecurringToSingleEvent(event);

    expect(updated.repeat).toEqual({ type: 'none', interval: 0 });
  });
});

describe('deleteSingleOccurrence', () => {
  it('특정 날짜의 occurrence만 제거한다', () => {
    const recurringEvent: Event = {
      id: '1',
      title: '반복 일정',
      date: '2025-07-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'daily', interval: 1, endDate: '2025-07-05' },
      notificationTime: 10,
    };

    const updated = deleteSingleOccurrence(recurringEvent, '2025-07-03');

    expect(updated.excludedDates).toContain('2025-07-03');
  });

  it('제외 날짜 배열이 중복되지 않도록 처리한다', () => {
    const recurringEvent: Event = {
      id: '1',
      title: '반복 일정',
      date: '2025-07-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'daily', interval: 1, endDate: '2025-07-05' },
      notificationTime: 10,
      excludedDates: ['2025-07-03'],
    };

    const updated = deleteSingleOccurrence(recurringEvent, '2025-07-03');

    expect(updated.excludedDates).toEqual(['2025-07-03']);
  });

  it('기존에 제외된 날짜가 없으면 배열 생성 후 추가한다', () => {
    const recurringEvent: Event = {
      id: '2',
      title: '반복 일정',
      date: '2025-07-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-08-01' },
      notificationTime: 10,
    };

    const updated = deleteSingleOccurrence(recurringEvent, '2025-07-15');

    expect(updated.excludedDates).toEqual(['2025-07-15']);
  });
});
