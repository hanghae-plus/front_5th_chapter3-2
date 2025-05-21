import { EventForm } from '../../types';
import { generateRepeatEvents } from '../../utils/repeatUtils';

describe('반복 유형 선택', () => {
  it('매일 반복을 선택했을 때, 시작일부터 일정이 생성되어야 한다', () => {
    const baseEvent: EventForm = {
      title: '회의',
      date: '2025-05-20',
      startTime: '09:00',
      endTime: '10:00',
      description: '주간 회의',
      location: '회의실 A',
      category: '업무',
      notificationTime: 10,
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-05-23',
      },
    };

    const result = generateRepeatEvents(baseEvent);

    const dates = result.map((e) => e.date);
    expect(dates).toEqual(['2025-05-20', '2025-05-21', '2025-05-22', '2025-05-23']);
  });
  it('매주 반복을 선택했을 때, 시작일 기준으로 interval에 따라 매주 일정이 생성되어야 한다', () => {
    const baseEvent: EventForm = {
      title: '주간 미팅',
      date: '2025-05-20',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      notificationTime: 5,
      repeat: {
        type: 'weekly',
        interval: 1,
        endDate: '2025-06-17',
      },
    };

    const result = generateRepeatEvents(baseEvent);
    const dates = result.map((e) => e.date);

    expect(dates).toEqual(['2025-05-20', '2025-05-27', '2025-06-03', '2025-06-10', '2025-06-17']);
  });
  it('매월 반복을 선택했을 때, 시작일과 같은 날짜 기준으로 생성되어야 한다', () => {
    const baseEvent: EventForm = {
      title: '월간 미팅',
      date: '2025-05-20',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      notificationTime: 5,
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2025-06-20',
      },
    };

    const result = generateRepeatEvents(baseEvent);
    const dates = result.map((e) => e.date);

    expect(dates).toEqual(['2025-05-20', '2025-06-20']);
  });
  it('매월 반복에서 31일은 없는 달에서는 마지막 날로 보정되어야 한다', () => {
    const baseEvent: EventForm = {
      title: '말일 점검',
      date: '2025-01-31',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      notificationTime: 15,
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2025-06-30',
      },
    };

    const result = generateRepeatEvents(baseEvent);
    const dates = result.map((e) => e.date);

    expect(dates).toEqual([
      '2025-01-31',
      '2025-02-28',
      '2025-03-31',
      '2025-04-30',
      '2025-05-31',
      '2025-06-30',
    ]);
  });

  it('매월 반복에서 30일도 없는 달에서는 해당 달의 마지막 날로 보정되어야 한다', () => {
    const baseEvent: EventForm = {
      title: '말일 근무 보고',
      date: '2025-01-30',
      startTime: '18:00',
      endTime: '19:00',
      description: '',
      location: '',
      category: '',
      notificationTime: 5,
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2025-03-30',
      },
    };

    const result = generateRepeatEvents(baseEvent);
    const dates = result.map((e) => e.date);

    expect(dates).toEqual(['2025-01-30', '2025-02-28', '2025-03-30']);
  });
  it('매년 반복을 선택했을 때, 시작일과 같은 월/일에 생성되어야 한다', () => {
    const baseEvent: EventForm = {
      title: '창립기념일',
      date: '2025-05-10',
      startTime: '00:00',
      endTime: '23:59',
      description: '',
      location: '',
      category: '',
      notificationTime: 0,
      repeat: {
        type: 'yearly',
        interval: 1,
        endDate: '2027-05-10',
      },
    };

    const result = generateRepeatEvents(baseEvent);
    const dates = result.map((e) => e.date);

    expect(dates).toEqual(['2025-05-10', '2026-05-10', '2027-05-10']);
  });

  it('매년 반복에서 2월 29일은 윤년이 아닌 해에는 2월 28일로 보정되어야 한다', () => {
    const baseEvent: EventForm = {
      title: '윤년 이벤트',
      date: '2024-02-29',
      startTime: '00:00',
      endTime: '01:00',
      description: '',
      location: '',
      category: '',
      notificationTime: 0,
      repeat: {
        type: 'yearly',
        interval: 1,
        endDate: '2028-02-29',
      },
    };

    const result = generateRepeatEvents(baseEvent);
    const dates = result.map((e) => e.date);

    expect(dates).toEqual(['2024-02-29', '2025-02-28', '2026-02-28', '2027-02-28', '2028-02-29']);
  });
});

describe('반복 간격 설정', () => {
  describe('반복 간격 설정', () => {
    it('매일 반복에서 간격을 설정하면 해당 간격에 맞게 일정이 생성되어야 한다', () => {
      const baseEvent: EventForm = {
        title: '체크인',
        date: '2025-05-01',
        startTime: '09:00',
        endTime: '09:30',
        description: '',
        location: '',
        category: '',
        notificationTime: 5,
        repeat: {
          type: 'daily',
          interval: 2,
          endDate: '2025-05-07',
        },
      };

      const result = generateRepeatEvents(baseEvent);
      const dates = result.map((e) => e.date);

      expect(dates).toEqual(['2025-05-01', '2025-05-03', '2025-05-05', '2025-05-07']);
    });

    it('매주 반복에서 간격을 설정하면 해당 간격에 맞게 일정이 생성되어야 한다', () => {
      const baseEvent: EventForm = {
        title: '팀 미팅',
        date: '2025-05-06',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '',
        notificationTime: 10,
        repeat: {
          type: 'weekly',
          interval: 2,
          endDate: '2025-06-17',
        },
      };

      const result = generateRepeatEvents(baseEvent);
      const dates = result.map((e) => e.date);

      expect(dates).toEqual(['2025-05-06', '2025-05-20', '2025-06-03', '2025-06-17']);
    });

    it('매월 반복에서 간격을 설정하면 해당 간격에 맞게 일정이 생성되어야 한다', () => {
      const baseEvent: EventForm = {
        title: '월간 리뷰',
        date: '2025-01-15',
        startTime: '15:00',
        endTime: '16:00',
        description: '',
        location: '',
        category: '',
        notificationTime: 15,
        repeat: {
          type: 'monthly',
          interval: 2,
          endDate: '2025-07-15',
        },
      };

      const result = generateRepeatEvents(baseEvent);
      const dates = result.map((e) => e.date);

      expect(dates).toEqual(['2025-01-15', '2025-03-15', '2025-05-15', '2025-07-15']);
    });

    it('매년 반복에서 간격을 설정하면 해당 간격에 맞게 일정이 생성되어야 한다', () => {
      const baseEvent: EventForm = {
        title: '격년 컨퍼런스',
        date: '2025-06-01',
        startTime: '10:00',
        endTime: '18:00',
        description: '',
        location: '',
        category: '',
        notificationTime: 30,
        repeat: {
          type: 'yearly',
          interval: 2,
          endDate: '2031-06-01',
        },
      };

      const result = generateRepeatEvents(baseEvent);
      const dates = result.map((e) => e.date);

      expect(dates).toEqual(['2025-06-01', '2027-06-01', '2029-06-01', '2031-06-01']);
    });
  });
});

describe('반복 종료 조건', () => {
  it('untilDate가 지정된 경우, 해당 날짜까지만 일정이 생성되어야 한다');
  it('maxCount가 지정된 경우, 지정된 횟수만큼만 일정이 생성되어야 한다');
  it('untilDate와 maxCount가 동시에 지정되면, 더 빠른 조건을 기준으로 종료되어야 한다');
  it('종료 조건이 없는 경우, 기본적으로 2025-09-30까지만 생성되어야 한다');
});
