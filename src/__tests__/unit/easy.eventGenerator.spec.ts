import { Event } from '../../types';
import { generateRepeatEvents, getNextOccurrence } from '../../utils/eventGenerator';

describe('eventGenerator 테스트', () => {
  it('윤년 29일이나 31일에 매월/매년 반복 설정 시 적절히 처리된다', async () => {
    // 윤년 2월 29일 테스트
    const leapYearEvent: Event = {
      id: 'leap-year-event',
      title: '윤년 이벤트',
      date: '2024-02-29', // 윤년 2월 29일
      startTime: '11:00',
      endTime: '12:00',
      description: '윤년 특수 케이스',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'yearly', interval: 1 },
      notificationTime: 10,
    };

    // 2025년 (윤년이 아님)으로 이동했을 때 2월 28일이 되어야 함
    const nextYearOccurrence = getNextOccurrence(leapYearEvent, new Date('2025-01-01'));

    expect(nextYearOccurrence.getFullYear()).toBe(2025);
    expect(nextYearOccurrence.getMonth()).toBe(1); // 2월 (0부터 시작)
    expect(nextYearOccurrence.getDate()).toBe(28); // 윤년이 아니므로 28일

    // 다시 윤년으로 이동 (2028년은 윤년)
    const nextLeapYear = getNextOccurrence(leapYearEvent, new Date('2028-01-01'));
    expect(nextLeapYear.getFullYear()).toBe(2028);
    expect(nextLeapYear.getMonth()).toBe(1); // 2월
    expect(nextLeapYear.getDate()).toBe(29); // 윤년이므로 29일

    // 31일 매월 반복 테스트
    const monthlyEvent: Event = {
      id: 'monthly-31',
      title: '월말 이벤트',
      date: '2025-01-31', // 1월 31일
      startTime: '11:00',
      endTime: '12:00',
      description: '매월 31일',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'monthly', interval: 1 },
      notificationTime: 10,
    };

    // 2월로 이동 (28일까지만 있음)
    const nextMonthOccurrence = getNextOccurrence(monthlyEvent, new Date('2025-02-01'));
    expect(nextMonthOccurrence.getMonth()).toBe(1); // 2월
    expect(nextMonthOccurrence.getDate()).toBe(28); // 2월은 28일까지만 있으므로

    // 3월로 이동 (31일까지 있음)
    const marchOccurrence = getNextOccurrence(monthlyEvent, new Date('2025-03-01'));
    expect(marchOccurrence.getMonth()).toBe(2); // 3월
    expect(marchOccurrence.getDate()).toBe(31); // 3월은 31일까지 있으므로

    // 4월로 이동 (30일까지만 있음)
    const aprilOccurrence = getNextOccurrence(monthlyEvent, new Date('2025-04-01'));
    expect(aprilOccurrence.getMonth()).toBe(3); // 4월
    expect(aprilOccurrence.getDate()).toBe(30); // 4월은 30일까지만 있으므로
  });

  it('일(daily) 반복 간격(interval)을 올바르게 처리한다', async () => {
    const triDailyEvent: Event = {
      id: 'tri-daily',
      title: '3일마다',
      date: '2025-01-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '3일마다 반복',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 3 },
      notificationTime: 10,
    };

    const nextTriDaily = getNextOccurrence(triDailyEvent, new Date('2025-01-02'));
    expect(nextTriDaily.getDate()).toBe(4);
  });

  it('주간(weekly) 반복 간격(interval)을 올바르게 처리한다', async () => {
    const biWeeklyEvent: Event = {
      id: 'bi-weekly',
      title: '2주마다',
      date: '2025-01-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '2주마다 반복',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'weekly', interval: 2 },
      notificationTime: 10,
    };

    const nextBiWeekly = getNextOccurrence(biWeeklyEvent, new Date('2025-01-02'));
    expect(nextBiWeekly.getDate()).toBe(15);
  });

  it('generateRepeatEvents가 종료 날짜를 올바르게 처리한다', async () => {
    // 종료 날짜가 있는 매주 반복 이벤트
    const weeklyEventWithEnd: Event = {
      id: 'weekly-limited',
      title: '기간 제한 매주 반복',
      date: '2025-01-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '3주간만 반복',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'weekly',
        interval: 1,
        endDate: '2025-01-21', // 3주 후
      },
      notificationTime: 10,
    };

    const repeatEvents = generateRepeatEvents(weeklyEventWithEnd);

    // 원본 + 2회 반복 = 총 3개
    expect(repeatEvents).toHaveLength(3);
    expect(repeatEvents[0].date).toBe('2025-01-01'); // 원본
    expect(repeatEvents[1].date).toBe('2025-01-08'); // 1주 후
    expect(repeatEvents[2].date).toBe('2025-01-15'); // 2주 후
    // 2025-01-22는 종료 날짜(2025-01-21) 이후이므로 생성되지 않음

    // 종료 날짜가 없는 경우 (현재 날짜부터 1년 후까지)
    const unlimitedEvent: Event = {
      id: 'unlimited',
      title: '무제한 반복',
      date: '2025-01-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '1년간 반복',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'monthly',
        interval: 1,
        // endDate 없음
      },
      notificationTime: 10,
    };

    const unlimitedEvents = generateRepeatEvents(unlimitedEvent);

    // 원본(1월) + 11회 반복(2월~12월) = 총 12개
    expect(unlimitedEvents).toHaveLength(12);
    expect(unlimitedEvents[0].date).toBe('2025-01-01'); // 1월 (원본)
    expect(unlimitedEvents[1].date).toBe('2025-02-01'); // 2월
    expect(unlimitedEvents[11].date).toBe('2025-12-01'); // 12월 (마지막)
  });
});
