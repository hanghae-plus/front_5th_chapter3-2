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

  it('일(daily) 반복 간격(interval)을 올바르게 처리한다', async () => {});

  it('주간(weekly) 반복 간격(interval)을 올바르게 처리한다', async () => {});

  it('generateRepeatEvents가 종료 날짜를 올바르게 처리한다', () => {});
});
