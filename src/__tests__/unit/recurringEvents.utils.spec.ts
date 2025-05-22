import { Event } from '../../types';
import { generateRecurringEvents } from '../../utils/recurringEventUtils';

describe('반복 일정 유틸리티 함수 테스트', () => {
  // Base event for testing
  const baseEvent: Omit<Event, 'id'> = {
    title: '반복 회의',
    date: '2025-10-01',
    startTime: '10:00',
    endTime: '11:00',
    description: '팀 주간 회의',
    location: '회의실 A',
    category: '업무',
    repeat: {
      type: 'none',
      interval: 0,
    },
    notificationTime: 10,
  };

  // 실패 테스트: 반복 일정 생성 불가
  it('반복 일정 생성 함수가 정의되지 않았다 (실패 테스트)', () => {
    // generateRecurringEvents 함수가 아직 정의되지 않았거나 올바르게 동작하지 않을 경우
    expect(() =>
      generateRecurringEvents({
        ...baseEvent,
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: '2025-10-05',
        },
      })
    ).toThrow();
  });

  // 성공 테스트: 매일 반복 일정 생성
  it('매일 반복 일정을 올바르게 생성한다', () => {
    const dailyEvent = {
      ...baseEvent,
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: '2025-10-05',
      },
    };

    const events = generateRecurringEvents(dailyEvent);

    // 시작일(10/1)부터 종료일(10/5)까지 총 5개의 이벤트가 생성되어야 함
    expect(events.length).toBe(5);

    // 첫 번째 이벤트 날짜는 원본과 동일
    expect(events[0].date).toBe('2025-10-01');

    // 모든 이벤트가 동일한 반복 ID를 가짐
    const repeatId = events[0].repeat.id;
    expect(repeatId).toBeDefined();
    events.forEach((event) => {
      expect(event.repeat.id).toBe(repeatId);
    });

    // 날짜가 순차적으로 증가
    expect(events[1].date).toBe('2025-10-02');
    expect(events[2].date).toBe('2025-10-03');
    expect(events[3].date).toBe('2025-10-04');
    expect(events[4].date).toBe('2025-10-05');
  });

  // 성공 테스트: 격일 반복 일정 생성
  it('격일(2일마다) 반복 일정을 올바르게 생성한다', () => {
    const everyOtherDayEvent = {
      ...baseEvent,
      repeat: {
        type: 'daily',
        interval: 2,
        endDate: '2025-10-09',
      },
    };

    const events = generateRecurringEvents(everyOtherDayEvent);

    // 10/1, 10/3, 10/5, 10/7, 10/9 총 5개의 이벤트가 생성되어야 함
    expect(events.length).toBe(5);

    expect(events[0].date).toBe('2025-10-01');
    expect(events[1].date).toBe('2025-10-03');
    expect(events[2].date).toBe('2025-10-05');
    expect(events[3].date).toBe('2025-10-07');
    expect(events[4].date).toBe('2025-10-09');
  });

  // 성공 테스트: 매주 반복 일정 생성
  it('매주 반복 일정을 올바르게 생성한다', () => {
    const weeklyEvent = {
      ...baseEvent,
      repeat: {
        type: 'weekly',
        interval: 1,
        endDate: '2025-10-29',
      },
    };

    const events = generateRecurringEvents(weeklyEvent);

    // 10/1, 10/8, 10/15, 10/22, 10/29 총 5개의 이벤트가 생성되어야 함
    expect(events.length).toBe(5);

    expect(events[0].date).toBe('2025-10-01');
    expect(events[1].date).toBe('2025-10-08');
    expect(events[2].date).toBe('2025-10-15');
    expect(events[3].date).toBe('2025-10-22');
    expect(events[4].date).toBe('2025-10-29');
  });

  // 성공 테스트: 격주 반복 일정 생성
  it('격주(2주마다) 반복 일정을 올바르게 생성한다', () => {
    const biweeklyEvent = {
      ...baseEvent,
      repeat: {
        type: 'weekly',
        interval: 2,
        endDate: '2025-10-29',
      },
    };

    const events = generateRecurringEvents(biweeklyEvent);

    // 10/1, 10/15, 10/29 총 3개의 이벤트가 생성되어야 함
    expect(events.length).toBe(3);

    expect(events[0].date).toBe('2025-10-01');
    expect(events[1].date).toBe('2025-10-15');
    expect(events[2].date).toBe('2025-10-29');
  });

  // 성공 테스트: 매월 반복 일정 생성
  it('매월 반복 일정을 올바르게 생성한다', () => {
    const monthlyEvent = {
      ...baseEvent,
      date: '2025-08-15', // 시작 날짜를 8월 15일로 설정
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2025-12-15',
      },
    };

    const events = generateRecurringEvents(monthlyEvent);

    // 8/15, 9/15, 10/15, 11/15, 12/15 총 5개의 이벤트가 생성되어야 함
    expect(events.length).toBe(5);

    expect(events[0].date).toBe('2025-08-15');
    expect(events[1].date).toBe('2025-09-15');
    expect(events[2].date).toBe('2025-10-15');
    expect(events[3].date).toBe('2025-11-15');
    expect(events[4].date).toBe('2025-12-15');
  });

  // 성공 테스트: 매년 반복 일정 생성
  it('매년 반복 일정을 올바르게 생성한다', () => {
    const yearlyEvent = {
      ...baseEvent,
      date: '2025-10-10', // 시작 날짜를 2025년 10월 10일로 설정
      repeat: {
        type: 'yearly',
        interval: 1,
        endDate: '2027-10-10',
      },
    };

    const events = generateRecurringEvents(yearlyEvent);

    // 2025/10/10, 2026/10/10, 2027/10/10 총 3개의 이벤트가 생성되어야 함
    expect(events.length).toBe(3);

    expect(events[0].date).toBe('2025-10-10');
    expect(events[1].date).toBe('2026-10-10');
    expect(events[2].date).toBe('2027-10-10');
  });

  // 성공 테스트: 윤년(2월 29일) 처리
  it('윤년 날짜(2월 29일)에 대한 매월 반복을 올바르게 처리한다', () => {
    const leapYearEvent = {
      ...baseEvent,
      date: '2024-02-29', // 2024년은 윤년으로 2월 29일이 존재함
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2024-06-30',
      },
    };

    const events = generateRecurringEvents(leapYearEvent);

    // 2/29, 3/29, 4/29, 5/29 총 4개의 이벤트가 생성되어야 함
    expect(events.length).toBe(4);

    expect(events[0].date).toBe('2024-02-29');
    expect(events[1].date).toBe('2024-03-29');
    expect(events[2].date).toBe('2024-04-29');
    expect(events[3].date).toBe('2024-05-29');
  });

  // 성공 테스트: 31일 처리
  it('31일이 있는 월에서 30일이 없는 월로의 반복을 올바르게 처리한다', () => {
    const thirtyFirstDayEvent = {
      ...baseEvent,
      date: '2025-01-31', // 1월 31일로 시작
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2025-05-31',
      },
    };

    const events = generateRecurringEvents(thirtyFirstDayEvent);

    // 1/31, 2/28, 3/31, 4/30, 5/31 총 5개의 이벤트가 생성되어야 함
    expect(events.length).toBe(5);

    expect(events[0].date).toBe('2025-01-31');
    expect(events[1].date).toBe('2025-02-28'); // 2월은 28일까지만 있음 (2025년은 평년)
    expect(events[2].date).toBe('2025-03-31');
    expect(events[3].date).toBe('2025-04-30'); // 4월은 30일까지만 있음
    expect(events[4].date).toBe('2025-05-31');
  });
});
