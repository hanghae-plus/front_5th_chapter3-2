import { renderHook } from '@testing-library/react';

import { Event } from '../types';
import { createRepeatEvents } from '../utils/createRepeatEvents';
describe('createRepeatEvents', () => {
  describe('반복 일정 테스트', () => {
    it('반복 설정이 되어있지 않으면 단일 일정을 반환한다.', () => {
      const singleEvent: Event = {
        id: '1',
        title: '반복 일정 테스트',
        date: '2025-05-22',
        startTime: '10:00',
        endTime: '11:00',
        description: '반복 일정 테스트입니다.',
        location: '사무실',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      };

      const { result } = renderHook(() => createRepeatEvents(singleEvent));

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(singleEvent);
    });

    it('입력한 종료 날짜까지 1일마다 매일 반복되는 일정을 생성한다.', () => {
      const dailyEvent: Event = {
        id: '1',
        title: '반복 일정 테스트',
        date: '2025-05-22',
        startTime: '10:00',
        endTime: '11:00',
        description: '반복 일정 테스트입니다.',
        location: '사무실',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-05-26' },
        notificationTime: 10,
      };

      const { result } = renderHook(() => createRepeatEvents(dailyEvent));
      const resultDate = result.current.map((e) => e.date);

      expect(resultDate).toHaveLength(5);
      expect(resultDate).toEqual([
        '2025-05-22',
        '2025-05-23',
        '2025-05-24',
        '2025-05-25',
        '2025-05-26',
      ]);
    });

    it('입력한 종료 날짜까지 1주마다 매주 반복되는 일정을 생성한다.', () => {
      const weeklyEvent: Event = {
        id: '1',
        title: '반복 일정 테스트',
        date: '2025-05-19',
        startTime: '10:00',
        endTime: '11:00',
        description: '반복 일정 테스트입니다.',
        location: '사무실',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-06-02' },
        notificationTime: 10,
      };

      const { result } = renderHook(() => createRepeatEvents(weeklyEvent));
      const resultDate = result.current.map((e) => e.date);

      expect(resultDate).toHaveLength(3);
      expect(resultDate).toEqual(['2025-05-19', '2025-05-26', '2025-06-02']);
    });

    it('입력한 종료 날짜까지 1달마다 매월 반복되는 일정을 생성한다.', () => {
      const monthlyEvent: Event = {
        id: '1',
        title: '반복 일정 테스트',
        date: '2025-05-22',
        startTime: '10:00',
        endTime: '11:00',
        description: '반복 일정 테스트입니다.',
        location: '사무실',
        category: '업무',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-08-22' },
        notificationTime: 10,
      };

      const { result } = renderHook(() => createRepeatEvents(monthlyEvent));
      const resultDate = result.current.map((e) => e.date);

      expect(resultDate).toHaveLength(4);
      expect(resultDate).toEqual(['2025-05-22', '2025-06-22', '2025-07-22', '2025-08-22']);
    });
  });

  it('입력한 종료 날짜까지 1년마다 매년 반복되는 일정을 생성한다.', () => {
    const yearlyEvent: Event = {
      id: '1',
      title: '반복 일정 테스트',
      date: '2025-05-31',
      startTime: '10:00',
      endTime: '11:00',
      description: '반복 일정 테스트입니다.',
      location: '사무실',
      category: '업무',
      repeat: { type: 'yearly', interval: 1, endDate: '2027-05-31' },
      notificationTime: 10,
    };

    const { result } = renderHook(() => createRepeatEvents(yearlyEvent));
    const resultDate = result.current.map((e) => e.date);

    expect(resultDate).toHaveLength(3);
    expect(resultDate).toEqual(['2025-05-31', '2026-05-31', '2027-05-31']);
  });

  it('종료 날짜를 입력하지 않으면 2025-09-30까지만 반복 일정이 생성된다.', () => {
    const monthlyEvent: Event = {
      id: '1',
      title: '반복 일정 테스트',
      date: '2025-05-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '반복 일정 테스트입니다.',
      location: '사무실',
      category: '업무',
      repeat: { type: 'monthly', interval: 1 },
      notificationTime: 10,
    };

    const { result } = renderHook(() => createRepeatEvents(monthlyEvent));
    const resultDate = result.current.map((e) => e.date);

    expect(resultDate).toHaveLength(5);
    expect(resultDate).toEqual([
      '2025-05-15',
      '2025-06-15',
      '2025-07-15',
      '2025-08-15',
      '2025-09-15',
    ]);
  });
});

describe('윤년 2월 29일 매년 반복 일정', () => {
  it('윤년이 아닌 해의 2월 29일 매년 반복 일정은 2월 28일로 조정된다.', () => {
    const yearlyEvent: Event = {
      id: '1',
      title: '반복 일정 테스트',
      date: '2024-02-29',
      startTime: '10:00',
      endTime: '11:00',
      description: '반복 일정 테스트입니다.',
      location: '사무실',
      category: '업무',
      repeat: { type: 'yearly', interval: 1, endDate: '2025-12-31' },
      notificationTime: 10,
    };

    const { result } = renderHook(() => createRepeatEvents(yearlyEvent));
    const resultDate = result.current.map((e) => e.date);

    expect(resultDate).toHaveLength(2);
    expect(resultDate).toEqual(['2024-02-29', '2025-02-28']);
  });

  it('다음 윤년에는 2월 29일에 정상적으로 반복된다.', () => {
    const yearlyEvent: Event = {
      id: '1',
      title: '반복 일정 테스트',
      date: '2024-02-29',
      startTime: '10:00',
      endTime: '11:00',
      description: '반복 일정 테스트입니다.',
      location: '사무실',
      category: '업무',
      repeat: { type: 'yearly', interval: 1, endDate: '2028-12-31' },
      notificationTime: 10,
    };

    const { result } = renderHook(() => createRepeatEvents(yearlyEvent));
    const resultDate = result.current.map((e) => e.date);

    expect(resultDate).toHaveLength(5);
    expect(resultDate).toEqual([
      '2024-02-29',
      '2025-02-28',
      '2026-02-28',
      '2027-02-28',
      '2028-02-29',
    ]);
  });
});

describe('31일 매월 반복 일정', () => {
  it('31일이 없는 달의 경우 해당 달의 마지막날로 조정된다.', () => {
    const monthlyEvent: Event = {
      id: '1',
      title: '반복 일정 테스트',
      date: '2025-01-31',
      startTime: '10:00',
      endTime: '11:00',
      description: '반복 일정 테스트입니다.',
      location: '사무실',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-02-28' },
      notificationTime: 10,
    };

    const { result } = renderHook(() => createRepeatEvents(monthlyEvent));
    const resultDate = result.current.map((e) => e.date);

    expect(resultDate).toHaveLength(2);
    expect(resultDate).toEqual(['2025-01-31', '2025-02-28']);
  });

  it('31일이 있는 달의 경우 31일에 정상적으로 반복된다.', () => {
    const monthlyEvent: Event = {
      id: '1',
      title: '반복 일정 테스트',
      date: '2025-01-31',
      startTime: '10:00',
      endTime: '11:00',
      description: '반복 일정 테스트입니다.',
      location: '사무실',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-03-31' },
      notificationTime: 10,
    };

    const { result } = renderHook(() => createRepeatEvents(monthlyEvent));
    const resultDate = result.current.map((e) => e.date);

    expect(resultDate).toHaveLength(3);
    expect(resultDate).toEqual(['2025-01-31', '2025-02-28', '2025-03-31']);
  });
});

describe('반복 일정 유효성 검사', () => {
  it('31일에 매월 반복 일정 생성이 가능하다.', () => {
    const monthlyEvent: Event = {
      id: '1',
      title: '매월 31일 반복 일정',
      date: '2025-01-31',
      startTime: '10:00',
      endTime: '11:00',
      description: '매월 31일 반복 일정 테스트입니다.',
      location: '사무실',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-05-31' },
      notificationTime: 10,
    };

    const { result } = renderHook(() => createRepeatEvents(monthlyEvent));
    const resultDate = result.current.map((e) => e.date);

    expect(resultDate).toHaveLength(5);
    expect(resultDate).toEqual([
      '2025-01-31',
      '2025-02-28',
      '2025-03-31',
      '2025-04-30',
      '2025-05-31',
    ]);
  });

  it('2월 29일에 매년 반복 일정 생성이 가능하다', () => {
    const yearlyEvent: Event = {
      id: '1',
      title: '윤년 반복 일정',
      date: '2024-02-29',
      startTime: '10:00',
      endTime: '11:00',
      description: '윤년 반복 일정 테스트입니다.',
      location: '사무실',
      category: '업무',
      repeat: { type: 'yearly', interval: 1, endDate: '2032-02-29' },
      notificationTime: 10,
    };

    const { result } = renderHook(() => createRepeatEvents(yearlyEvent));
    const resultDate = result.current.map((e) => e.date);

    expect(resultDate).toEqual(expect.arrayContaining(['2024-02-29', '2028-02-29', '2032-02-29']));
  });
});
