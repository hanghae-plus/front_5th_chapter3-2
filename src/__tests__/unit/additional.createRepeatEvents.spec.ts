import { EventForm } from '../../types';
import { createRepeatEvents, isLastDayOfMonth } from '../../utils/createRepeatEvents';

describe('createRepeatEvents', () => {
  it('반복 설정이 없는 경우 하나의 이벤트가 있는 배열을 반환한다.', () => {
    const event: EventForm = {
      title: '새 회의',
      date: '2025-10-16',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 5,
    };
    const result = createRepeatEvents(event);
    expect(result).toEqual([event]);
  });

  it('월말 처리: 월말 기준으로 등록할 경우 해당 월의 마지막 날을 반환한다.', () => {
    const event: EventForm = {
      title: '새 회의',
      date: '2025-01-31',
      startTime: '11:00',
      endTime: '12:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-04-30' },
      notificationTime: 5,
    };
    const result = createRepeatEvents(event);
    expect(result).toEqual([
      {
        title: '새 회의',
        date: '2025-01-31',
        startTime: '11:00',
        endTime: '12:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-04-30' },
        notificationTime: 5,
      },
      {
        title: '새 회의',
        date: '2025-02-28',
        startTime: '11:00',
        endTime: '12:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-04-30' },
        notificationTime: 5,
      },
      {
        title: '새 회의',
        date: '2025-03-31',
        startTime: '11:00',
        endTime: '12:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-04-30' },
        notificationTime: 5,
      },
      {
        title: '새 회의',
        date: '2025-04-30',
        startTime: '11:00',
        endTime: '12:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-04-30' },
        notificationTime: 5,
      },
    ]);
  });

  it('monthly 반복 저장, 1개월 간격', () => {
    const event: EventForm = {
      title: '새 회의',
      date: '2025-03-05',
      startTime: '10:00',
      endTime: '13:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-05-05' },
      notificationTime: 5,
    };

    const result = createRepeatEvents(event);
    expect(result).toEqual([
      {
        title: '새 회의',
        date: '2025-03-05',
        startTime: '10:00',
        endTime: '13:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-05-05' },
        notificationTime: 5,
      },
      {
        title: '새 회의',
        date: '2025-04-05',
        startTime: '10:00',
        endTime: '13:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-05-05' },
        notificationTime: 5,
      },
      {
        title: '새 회의',
        date: '2025-05-05',
        startTime: '10:00',
        endTime: '13:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-05-05' },
        notificationTime: 5,
      },
    ]);
  });

  it('weekly 반복 저장, 2주 간격', () => {
    const event: EventForm = {
      title: '새 회의',
      date: '2025-05-05',
      startTime: '10:00',
      endTime: '13:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 2, endDate: '2025-06-03' },
      notificationTime: 5,
    };

    const result = createRepeatEvents(event);
    expect(result).toEqual([
      {
        title: '새 회의',
        date: '2025-05-05',
        startTime: '10:00',
        endTime: '13:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 2, endDate: '2025-06-03' },
        notificationTime: 5,
      },
      {
        title: '새 회의',
        date: '2025-05-19',
        startTime: '10:00',
        endTime: '13:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 2, endDate: '2025-06-03' },
        notificationTime: 5,
      },
      {
        title: '새 회의',
        date: '2025-06-02',
        startTime: '10:00',
        endTime: '13:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'weekly', interval: 2, endDate: '2025-06-03' },
        notificationTime: 5,
      },
    ]);
  });

  it('daily 반복 저장, 3일 간격', () => {
    const event: EventForm = {
      title: '새 회의',
      date: '2025-05-05',
      startTime: '10:00',
      endTime: '13:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 3, endDate: '2025-05-15' },
      notificationTime: 5,
    };

    const result = createRepeatEvents(event);
    expect(result).toEqual([
      {
        title: '새 회의',
        date: '2025-05-05',
        startTime: '10:00',
        endTime: '13:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 3, endDate: '2025-05-15' },
        notificationTime: 5,
      },
      {
        title: '새 회의',
        date: '2025-05-08',
        startTime: '10:00',
        endTime: '13:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 3, endDate: '2025-05-15' },
        notificationTime: 5,
      },
      {
        title: '새 회의',
        date: '2025-05-11',
        startTime: '10:00',
        endTime: '13:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 3, endDate: '2025-05-15' },
        notificationTime: 5,
      },
      {
        title: '새 회의',
        date: '2025-05-14',
        startTime: '10:00',
        endTime: '13:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'daily', interval: 3, endDate: '2025-05-15' },
        notificationTime: 5,
      },
    ]);
  });

  it('yearly 반복 저장, 2년 간격', () => {
    const event: EventForm = {
      title: '새 회의',
      date: '2025-05-05',
      startTime: '10:00',
      endTime: '13:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'yearly', interval: 2, endDate: '2030-05-05' },
      notificationTime: 5,
    };

    const result = createRepeatEvents(event);
    expect(result).toEqual([
      {
        title: '새 회의',
        date: '2025-05-05',
        startTime: '10:00',
        endTime: '13:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 2, endDate: '2030-05-05' },
        notificationTime: 5,
      },
      {
        title: '새 회의',
        date: '2027-05-05',
        startTime: '10:00',
        endTime: '13:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 2, endDate: '2030-05-05' },
        notificationTime: 5,
      },
      {
        title: '새 회의',
        date: '2029-05-05',
        startTime: '10:00',
        endTime: '13:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 2, endDate: '2030-05-05' },
        notificationTime: 5,
      },
    ]);
  });

  it('yearly 반복 저장, 윤년 포함 1년 간격', () => {
    const event: EventForm = {
      title: '새 회의',
      date: '2024-02-29',
      startTime: '10:00',
      endTime: '13:00',
      description: '새로운 팀 미팅',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'yearly', interval: 1, endDate: '2026-05-05' },
      notificationTime: 5,
    };

    const result = createRepeatEvents(event);
    expect(result).toEqual([
      {
        title: '새 회의',
        date: '2024-02-29',
        startTime: '10:00',
        endTime: '13:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 1, endDate: '2026-05-05' },
        notificationTime: 5,
      },
      {
        title: '새 회의',
        date: '2025-02-28',
        startTime: '10:00',
        endTime: '13:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 1, endDate: '2026-05-05' },
        notificationTime: 5,
      },
      {
        title: '새 회의',
        date: '2026-02-28',
        startTime: '10:00',
        endTime: '13:00',
        description: '새로운 팀 미팅',
        location: '회의실 A',
        category: '업무',
        repeat: { type: 'yearly', interval: 1, endDate: '2026-05-05' },
        notificationTime: 5,
      },
    ]);
  });
});

describe('isLastDayOfMonth', () => {
  it('2024-01-31', () => {
    const result = isLastDayOfMonth(new Date('2024-01-31'));

    expect(result).toBe(true);
  });
  it('2024-02-29', () => {
    const result = isLastDayOfMonth(new Date('2024-02-29'));

    expect(result).toBe(true);
  });
  it('2025-02-28', () => {
    const result = isLastDayOfMonth(new Date('2025-02-28'));

    expect(result).toBe(true);
  });
});
