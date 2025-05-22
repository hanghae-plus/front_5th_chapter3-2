import { Event } from '@/types';
import { generateRecurringEvents } from '@/utils/generateRecurringEvents';

describe('generateRecurringEvents', () => {
  it('반복 설정이 유효하지 않으면 원본 이벤트만 반환해야 한다', () => {
    const event: Event = {
      id: 'event-single',
      title: '단일 일정',
      date: '2025-05-01',
      startTime: '13:00',
      endTime: '14:00',
      description: '회의',
      location: '회의실',
      category: '업무',
      repeat: { type: 'daily', interval: 0 },
      notificationTime: 10,
    };

    const result = generateRecurringEvents(event);

    expect(result.length).toBe(1);
    expect(result[0]).toEqual(event);
  });

  it('반복 설정에 종료 날짜가 없으면 오류가 발생해야 한다', () => {
    const event: Event = {
      id: 'event-123',
      title: '기존 일정',
      date: '2025-05-01',
      startTime: '13:00',
      endTime: '14:00',
      description: 'CoreTech Weekly Standup',
      location: 'CoreTech 회의실',
      category: '업무',
      repeat: { type: 'daily', interval: 1 },
      notificationTime: 10,
    };

    expect(() => generateRecurringEvents(event)).toThrow('반복 설정에는 종료 날짜가 필요합니다.');
  });

  it('종료 날짜가 시작 날짜보다 이전이면 오류가 발생해야 한다', () => {
    const event: Event = {
      id: 'event-123',
      title: '기존 일정',
      date: '2025-05-01',
      startTime: '13:00',
      endTime: '14:00',
      description: 'CoreTech Weekly Standup',
      location: 'CoreTech 회의실',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2024-11-08' },
      notificationTime: 10,
    };

    expect(() => generateRecurringEvents(event)).toThrow(
      '종료 날짜는 시작 날짜보다 이후여야 합니다.'
    );
  });

  it('반복 날짜가 1일마다 반복되어야 하고, 시작 날짜와 종료 날짜를 모두 포함해야 한다', () => {
    const event: Event = {
      id: 'event-daily',
      title: '기존 일정',
      date: '2025-05-01',
      startTime: '13:00',
      endTime: '14:00',
      description: 'CoreTech Weekly Standup',
      location: 'CoreTech 회의실',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-05-05' },
      notificationTime: 10,
    };

    const result = generateRecurringEvents(event);
    const resultDates = result.map((e) => e.date);

    expect(resultDates).toEqual([
      '2025-05-01',
      '2025-05-02',
      '2025-05-03',
      '2025-05-04',
      '2025-05-05',
    ]);
  });

  it('반복 날짜가 2일마다 반복되어야 하고, 종료 날짜를 초과하지 않는 범위 내에서 반복되어야 한다', () => {
    const event: Event = {
      id: 'event-daily-2',
      title: '기존 일정',
      date: '2025-05-01',
      startTime: '13:00',
      endTime: '14:00',
      description: 'CoreTech Weekly Standup',
      location: 'CoreTech 회의실',
      category: '업무',
      repeat: { type: 'daily', interval: 2, endDate: '2025-05-10' },
      notificationTime: 10,
    };

    const result = generateRecurringEvents(event);
    const resultDates = result.map((e) => e.date);

    expect(resultDates).toEqual([
      '2025-05-01',
      '2025-05-03',
      '2025-05-05',
      '2025-05-07',
      '2025-05-09',
    ]);
  });

  it('반복 날짜가 1주마다 반복되어야 하고, 시작 날짜와 종료 날짜를 모두 포함해야 한다', () => {
    const event: Event = {
      id: 'event-weekly',
      title: '주간 회의',
      date: '2025-04-01',
      startTime: '13:00',
      endTime: '14:00',
      description: 'CoreTech Weekly Standup',
      location: 'CoreTech 회의실',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-04-29' },
      notificationTime: 10,
    };

    const result = generateRecurringEvents(event);
    const resultDates = result.map((e) => e.date);

    expect(resultDates).toEqual([
      '2025-04-01',
      '2025-04-08',
      '2025-04-15',
      '2025-04-22',
      '2025-04-29',
    ]);
  });

  it('반복 날짜가 2주마다 반복되어야 하고, 종료 날짜를 초과하지 않는 범위 내에서 반복되어야 한다', () => {
    const event: Event = {
      id: 'event-biweekly',
      title: '격주 회의',
      date: '2025-04-01',
      startTime: '13:00',
      endTime: '14:00',
      description: 'CoreTech Biweekly Standup',
      location: 'CoreTech 회의실',
      category: '업무',
      repeat: { type: 'weekly', interval: 2, endDate: '2025-05-15' },
      notificationTime: 10,
    };

    const result = generateRecurringEvents(event);
    const resultDates = result.map((e) => e.date);

    expect(resultDates).toEqual(['2025-04-01', '2025-04-15', '2025-04-29', '2025-05-13']);
  });

  it('반복 날짜가 1개월마다 반복되어야 하고, 시작 날짜와 종료 날짜를 모두 포함해야 한다', () => {
    const event: Event = {
      id: 'event-monthly',
      title: '월간 보고',
      date: '2025-05-01',
      startTime: '13:00',
      endTime: '14:00',
      description: '월간 보고 회의',
      location: 'CoreTech 회의실',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-08-01' },
      notificationTime: 10,
    };

    const result = generateRecurringEvents(event);
    const resultDates = result.map((e) => e.date);

    expect(resultDates).toEqual(['2025-05-01', '2025-06-01', '2025-07-01', '2025-08-01']);
  });

  it('반복 날짜가 3개월마다 반복되어야 하고, 종료 날짜를 초과하지 않는 범위 내에서 반복되어야 한다', () => {
    const event: Event = {
      id: 'event-quarterly',
      title: '분기 보고',
      date: '2025-05-01',
      startTime: '13:00',
      endTime: '14:00',
      description: '분기 보고 회의',
      location: 'CoreTech 회의실',
      category: '업무',
      repeat: { type: 'monthly', interval: 3, endDate: '2026-05-01' },
      notificationTime: 10,
    };

    const result = generateRecurringEvents(event);
    const resultDates = result.map((e) => e.date);

    expect(resultDates).toEqual([
      '2025-05-01',
      '2025-08-01',
      '2025-11-01',
      '2026-02-01',
      '2026-05-01',
    ]);
  });

  it('반복 날짜가 1년마다 반복되어야 하고, 시작 날짜와 종료 날짜를 모두 포함해야 한다', () => {
    const event: Event = {
      id: 'event-yearly',
      title: '연간 회의',
      date: '2025-05-01',
      startTime: '13:00',
      endTime: '14:00',
      description: '연간 계획 회의',
      location: 'CoreTech 회의실',
      category: '업무',
      repeat: { type: 'yearly', interval: 1, endDate: '2027-05-01' },
      notificationTime: 10,
    };

    const result = generateRecurringEvents(event);
    const resultDates = result.map((e) => e.date);

    expect(resultDates).toEqual(['2025-05-01', '2026-05-01', '2027-05-01']);
  });

  it('사용자가 지정한 특정 횟수만큼 일정이 반복되어야 한다', () => {
    const event: Event = {
      id: 'event-max-occurrences',
      title: '주간 회의',
      date: '2025-04-01',
      startTime: '13:00',
      endTime: '14:00',
      description: 'CoreTech Weekly Standup',
      location: 'CoreTech 회의실',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-12-31' }, // 긴 종료일 설정
      notificationTime: 10,
    };

    const maxOccurrences = 4;
    const result = generateRecurringEvents(event, maxOccurrences);
    const resultDates = result.map((e) => e.date);

    expect(resultDates).toEqual(['2025-04-01', '2025-04-08', '2025-04-15', '2025-04-22']);
  });

  it('종료 날짜가 정확히 다음 반복일과 일치하는 경우 해당 날짜까지 포함되어야 한다', () => {
    const event: Event = {
      id: 'event-exact-end',
      title: '주간 회의',
      date: '2025-04-01',
      startTime: '13:00',
      endTime: '14:00',
      description: 'CoreTech Weekly Standup',
      location: 'CoreTech 회의실',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-04-22' }, // 마지막 반복일과 정확히 일치
      notificationTime: 10,
    };

    const result = generateRecurringEvents(event);
    const resultDates = result.map((e) => e.date);

    expect(resultDates).toEqual(['2025-04-01', '2025-04-08', '2025-04-15', '2025-04-22']);
  });

  it('윤년을 정확하게 처리해야 한다', () => {
    const event: Event = {
      id: 'event-leap-year',
      title: '특별 회의',
      date: '2024-02-28',
      startTime: '13:00',
      endTime: '14:00',
      description: '특별 회의',
      location: 'CoreTech 회의실',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2024-03-01' },
      notificationTime: 10,
    };

    const result = generateRecurringEvents(event);
    const resultDates = result.map((e) => e.date);

    expect(resultDates).toEqual([
      '2024-02-28',
      '2024-02-29', // 윤년 날짜 포함
      '2024-03-01',
    ]);
  });

  it('2월 29일 시작 반복 일정 - 3월 01일로 조정 옵션', () => {
    const event: Event = {
      id: 'event-leap-year-feb28',
      title: '윤년 기념일',
      date: '2024-02-29',
      startTime: '10:00',
      endTime: '11:00',
      description: '매년 발생하는 기념일',
      location: '회의실',
      category: '특별',
      repeat: {
        type: 'yearly',
        interval: 1,
        endDate: '2028-03-01',
      },
      notificationTime: 10,
    };

    const result = generateRecurringEvents(event);
    const resultDates = result.map((e) => e.date);

    expect(resultDates).toEqual([
      '2024-02-29',
      '2025-03-01',
      '2026-03-01',
      '2027-03-01',
      '2028-03-01',
    ]);
  });

  it('월말 날짜를 정확하게 처리해야 한다', () => {
    const event: Event = {
      id: 'event-month-end',
      title: '월말 보고',
      date: '2025-01-31',
      startTime: '13:00',
      endTime: '14:00',
      description: '월말 보고',
      location: 'CoreTech 회의실',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-04-30' },
      notificationTime: 10,
    };

    const result = generateRecurringEvents(event);
    const resultDates = result.map((e) => e.date);

    expect(resultDates).toEqual(['2025-01-31', '2025-02-28', '2025-03-31', '2025-04-30']);
  });

  describe('반복 종료 횟수', () => {
    test('최대 발생 횟수만 설정된 경우 지정된 횟수만큼 이벤트를 생성한다', () => {
      const event: Event = {
        id: 'event-month-end',
        title: '월말 보고',
        date: '2025-01-31',
        startTime: '13:00',
        endTime: '14:00',
        description: '월말 보고',
        location: 'CoreTech 회의실',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-06-01', maxOccurrences: 3 },
        notificationTime: 10,
      };
      const result = generateRecurringEvents(event, event.repeat.maxOccurrences);
      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2025-01-31');
      expect(result[1].date).toBe('2025-02-01');
      expect(result[2].date).toBe('2025-02-02');
    });

    test('weekly 반복 유형에서 최대 발생 횟수 적용', () => {
      const event: Event = {
        id: 'event-weekly',
        title: '주간 회의',
        date: '2025-03-05', // 수요일
        startTime: '14:00',
        endTime: '15:30',
        description: '주간 업무 회의',
        location: '회의실 B',
        category: '회의',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-06-30', maxOccurrences: 5 },
        notificationTime: 30,
      };

      const result = generateRecurringEvents(event, event.repeat.maxOccurrences);
      expect(result).toHaveLength(5);
      expect(result[0].date).toBe('2025-03-05');
      expect(result[1].date).toBe('2025-03-12');
      expect(result[2].date).toBe('2025-03-19');
      expect(result[3].date).toBe('2025-03-26');
      expect(result[4].date).toBe('2025-04-02');
    });

    test('monthly 반복 유형에서 최대 발생 횟수 적용', () => {
      const event: Event = {
        id: 'event-monthly',
        title: '월간 보고',
        date: '2025-01-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '월간 실적 보고',
        location: '대회의실',
        category: '보고',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-12-31', maxOccurrences: 4 },
        notificationTime: 60,
      };

      const result = generateRecurringEvents(event, event.repeat.maxOccurrences);
      expect(result).toHaveLength(4);
      expect(result[0].date).toBe('2025-01-15');
      expect(result[1].date).toBe('2025-02-15');
      expect(result[2].date).toBe('2025-03-15');
      expect(result[3].date).toBe('2025-04-15');
    });

    test('yearly 반복 유형에서 최대 발생 횟수 적용', () => {
      const event: Event = {
        id: 'event-yearly-max',
        title: '연례 전략 회의',
        date: '2025-01-15',
        startTime: '09:00',
        endTime: '17:00',
        description: '연간 사업 계획 및 전략 수립',
        location: '본사 대회의실',
        category: '회의',
        repeat: { type: 'yearly', interval: 1, endDate: '2035-01-15', maxOccurrences: 5 },
        notificationTime: 1440,
      };

      const result = generateRecurringEvents(event, event.repeat.maxOccurrences);

      expect(result).toHaveLength(5);

      expect(result[0].date).toBe('2025-01-15');
      expect(result[1].date).toBe('2026-01-15');
      expect(result[2].date).toBe('2027-01-15');
      expect(result[3].date).toBe('2028-01-15');
      expect(result[4].date).toBe('2029-01-15');
    });

    test('종료 날짜가 먼저 도달하는 경우', () => {
      const event: Event = {
        id: 'event-end-date-first',
        title: '프로젝트 회의',
        date: '2025-05-01',
        startTime: '11:00',
        endTime: '12:00',
        description: '프로젝트 진행 상황 점검',
        location: '회의실 C',
        category: '프로젝트',
        repeat: { type: 'daily', interval: 2, endDate: '2025-05-10', maxOccurrences: 10 },
        notificationTime: 20,
      };

      const result = generateRecurringEvents(event, event.repeat.maxOccurrences);
      expect(result).toHaveLength(5);
      expect(result[0].date).toBe('2025-05-01');
      expect(result[4].date).toBe('2025-05-09');
    });

    test('시간 정보가 올바르게 유지되는지 확인', () => {
      const event: Event = {
        id: 'event-time-check',
        title: '시간 테스트',
        date: '2025-03-10',
        startTime: '15:45',
        endTime: '16:30',
        description: '시간 설정 확인',
        location: '사무실',
        category: '테스트',
        repeat: { type: 'daily', interval: 1, endDate: '2025-03-12' },
        notificationTime: 15,
      };

      const result = generateRecurringEvents(event);
      expect(result).toHaveLength(3);

      result.forEach((evt) => {
        expect(evt.startTime).toBe('15:45');
        expect(evt.endTime).toBe('16:30');
        expect(evt.notificationTime).toBe(15);
      });
    });
  });
});
