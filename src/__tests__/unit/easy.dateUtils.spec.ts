import { Event } from '../../types';
import {
  fillZero,
  formatDate,
  formatMonth,
  formatWeek,
  getDaysInMonth,
  getEventsForDay,
  getWeekDates,
  getWeeksAtMonth,
  isDateInRange,
  createDate,
  getLastDateStringOfMonth,
  getDateRange,
} from '../../utils/dateUtils';

describe('getDaysInMonth', () => {
  it('1월은 31일 수를 반환한다', () => {
    expect(getDaysInMonth(2025, 1)).toBe(31); // 1월
  });

  it('4월은 30일 일수를 반환한다', () => {
    expect(getDaysInMonth(2025, 4)).toBe(30); // 4월
  });

  it('윤년의 2월에 대해 29일을 반환한다', () => {
    expect(getDaysInMonth(2024, 2)).toBe(29); // 2024년은 윤년
  });

  it('평년의 2월에 대해 28일을 반환한다', () => {
    expect(getDaysInMonth(2023, 2)).toBe(28); // 2023년은 평년
  });

  it('유효하지 않은 월에 대해 적절히 처리한다', () => {
    expect(getDaysInMonth(2025, 0)).toBe(31); // 0은 이전 해의 12월로 처리됨
    expect(getDaysInMonth(2025, 13)).toBe(31); // 13은 다음 해의 1월로 처리됨
  });
});

describe('getWeekDates', () => {
  it('주중의 날짜(수요일)에 대해 올바른 주의 날짜들을 반환한다', () => {
    const date = new Date('2025-07-09'); // 수요일
    const weekDates = getWeekDates(date);
    expect(weekDates).toHaveLength(7);
    expect(weekDates[0].toISOString().split('T')[0]).toBe('2025-07-06'); // 일요일
    expect(weekDates[6].toISOString().split('T')[0]).toBe('2025-07-12'); // 토요일
  });

  it('주의 시작(월요일)에 대해 올바른 주의 날짜들을 반환한다', () => {
    const date = new Date('2025-07-07'); // 월요일
    const weekDates = getWeekDates(date);
    expect(weekDates).toHaveLength(7);
    expect(weekDates[0].toISOString().split('T')[0]).toBe('2025-07-06'); // 일요일
    expect(weekDates[6].toISOString().split('T')[0]).toBe('2025-07-12'); // 토요일
  });

  it('주의 끝(일요일)에 대해 올바른 주의 날짜들을 반환한다', () => {
    const date = new Date('2025-07-12'); // 토요일
    const weekDates = getWeekDates(date);
    expect(weekDates).toHaveLength(7);
    expect(weekDates[0].toISOString().split('T')[0]).toBe('2025-07-06'); // 일요일
    expect(weekDates[6].toISOString().split('T')[0]).toBe('2025-07-12'); // 일요일
  });

  it('연도를 넘어가는 주의 날짜를 정확히 처리한다 (연말)', () => {
    const date = new Date('2024-12-30'); // 월요일
    const weekDates = getWeekDates(date);
    expect(weekDates[0].toISOString().split('T')[0]).toBe('2024-12-29'); // 일요일
    expect(weekDates[6].toISOString().split('T')[0]).toBe('2025-01-04'); // 토요일
  });

  it('연도를 넘어가는 주의 날짜를 정확히 처리한다 (연초)', () => {
    const date = new Date('2025-01-01'); // 수요일
    const weekDates = getWeekDates(date);
    expect(weekDates[0].toISOString().split('T')[0]).toBe('2024-12-29'); // 일요일
    expect(weekDates[6].toISOString().split('T')[0]).toBe('2025-01-04'); // 토요일
  });

  it('윤년의 2월 29일을 포함한 주를 올바르게 처리한다', () => {
    const date = new Date('2024-02-29'); // 목요일 (윤년)
    const weekDates = getWeekDates(date);
    expect(weekDates[0].toISOString().split('T')[0]).toBe('2024-02-25'); // 일요일
    expect(weekDates[6].toISOString().split('T')[0]).toBe('2024-03-02'); // 토요일
  });

  it('월의 마지막 날짜를 포함한 주를 올바르게 처리한다', () => {
    const date = new Date('2025-04-30'); // 수요일
    const weekDates = getWeekDates(date);
    expect(weekDates[0].toISOString().split('T')[0]).toBe('2025-04-27'); // 일요일
    expect(weekDates[6].toISOString().split('T')[0]).toBe('2025-05-03'); // 토요일
  });
});

describe('getWeeksAtMonth', () => {
  it('2025년 7월 1일의 올바른 주 정보를 반환해야 한다', () => {
    const testDate = new Date('2025-07-01');
    const weeks = getWeeksAtMonth(testDate);
    expect(weeks).toEqual([
      [null, null, 1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10, 11, 12],
      [13, 14, 15, 16, 17, 18, 19],
      [20, 21, 22, 23, 24, 25, 26],
      [27, 28, 29, 30, 31, null, null],
    ]);
  });
});

describe('getEventsForDay', () => {
  const events: Event[] = [
    {
      id: '1',
      title: '이벤트 1',
      date: '2025-07-01',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 0,
    },
    {
      id: '2',
      title: '이벤트 2',
      date: '2025-07-01',
      startTime: '14:00',
      endTime: '15:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 0,
    },
    {
      id: '3',
      title: '이벤트 3',
      date: '2025-07-02',
      startTime: '11:00',
      endTime: '12:00',
      description: '',
      location: '',
      category: '',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 0,
    },
  ];

  it('특정 날짜(1일)에 해당하는 이벤트만 정확히 반환한다', () => {
    const dayEvents = getEventsForDay(events, 1);
    expect(dayEvents).toHaveLength(2);
    expect(dayEvents[0].title).toBe('이벤트 1');
    expect(dayEvents[1].title).toBe('이벤트 2');
  });

  it('해당 날짜에 이벤트가 없을 경우 빈 배열을 반환한다', () => {
    const dayEvents = getEventsForDay(events, 3);
    expect(dayEvents).toHaveLength(0);
  });

  it('날짜가 0일 경우 빈 배열을 반환한다', () => {
    const dayEvents = getEventsForDay(events, 0);
    expect(dayEvents).toHaveLength(0);
  });

  it('날짜가 32일 이상인 경우 빈 배열을 반환한다', () => {
    const dayEvents = getEventsForDay(events, 32);
    expect(dayEvents).toHaveLength(0);
  });
});

describe('formatWeek', () => {
  it('월의 중간 날짜에 대해 올바른 주 정보를 반환한다', () => {
    const date = new Date('2025-07-10');
    expect(formatWeek(date)).toBe('2025년 7월 2주');
  });

  it('월의 첫 주에 대해 올바른 주 정보를 반환한다', () => {
    const date = new Date('2025-07-01');
    expect(formatWeek(date)).toBe('2025년 7월 1주');
  });

  it('월의 마지막 주에 대해 올바른 주 정보를 반환한다', () => {
    const date = new Date('2025-07-31');
    expect(formatWeek(date)).toBe('2025년 7월 5주');
  });

  it('연도가 바뀌는 주에 대해 올바른 주 정보를 반환한다', () => {
    const date = new Date('2025-12-31');
    expect(formatWeek(date)).toBe('2026년 1월 1주');
  });

  it('윤년 2월의 마지막 주에 대해 올바른 주 정보를 반환한다', () => {
    const date = new Date('2025-02-29');
    expect(formatWeek(date)).toBe('2025년 2월 4주');
  });

  it('평년 2월의 마지막 주에 대해 올바른 주 정보를 반환한다', () => {
    const date = new Date('2023-02-28');
    expect(formatWeek(date)).toBe('2023년 3월 1주');
  });
});

describe('formatMonth', () => {
  test("2025년 7월 10일을 '2025년 7월'로 반환한다", () => {
    const date = new Date('2025-07-10');
    expect(formatMonth(date)).toBe('2025년 7월');
  });
});

describe('isDateInRange', () => {
  const rangeStart = new Date('2025-07-01');
  const rangeEnd = new Date('2025-07-31');

  it('범위 내의 날짜 2025-07-10에 대해 true를 반환한다', () => {
    const date = new Date('2025-07-10');
    expect(isDateInRange(date, rangeStart, rangeEnd)).toBe(true);
  });

  it('범위의 시작일 2025-07-01에 대해 true를 반환한다', () => {
    expect(isDateInRange(rangeStart, rangeStart, rangeEnd)).toBe(true);
  });

  it('범위의 종료일 2025-07-31에 대해 true를 반환한다', () => {
    expect(isDateInRange(rangeEnd, rangeStart, rangeEnd)).toBe(true);
  });

  it('범위 이전의 날짜 2025-06-30에 대해 false를 반환한다', () => {
    const outOfRangeDate = new Date('2025-06-30');
    expect(isDateInRange(outOfRangeDate, rangeStart, rangeEnd)).toBe(false);
  });

  it('범위 이후의 날짜 2025-08-01에 대해 false를 반환한다', () => {
    const outOfRangeDate = new Date('2025-08-01');
    expect(isDateInRange(outOfRangeDate, rangeStart, rangeEnd)).toBe(false);
  });

  it('시작일이 종료일보다 늦은 경우 모든 날짜에 대해 false를 반환한다', () => {
    const invalidRangeStart = new Date('2025-07-31');
    const invalidRangeEnd = new Date('2025-07-01');
    const testDate = new Date('2025-07-15');
    expect(isDateInRange(testDate, invalidRangeStart, invalidRangeEnd)).toBe(false);
  });
});

describe('fillZero', () => {
  test("5를 2자리로 변환하면 '05'를 반환한다", () => {
    expect(fillZero(5)).toBe('05');
  });

  test("10을 2자리로 변환하면 '10'을 반환한다", () => {
    expect(fillZero(10)).toBe('10');
  });

  test("3을 3자리로 변환하면 '003'을 반환한다", () => {
    expect(fillZero(3, 3)).toBe('003');
  });

  test("100을 2자리로 변환하면 '100'을 반환한다", () => {
    expect(fillZero(100)).toBe('100');
  });

  test("0을 2자리로 변환하면 '00'을 반환한다", () => {
    expect(fillZero(0)).toBe('00');
  });

  test("1을 5자리로 변환하면 '00001'을 반환한다", () => {
    expect(fillZero(1, 5)).toBe('00001');
  });

  test("소수점이 있는 3.14를 5자리로 변환하면 '03.14'를 반환한다", () => {
    expect(fillZero(3.14, 5)).toBe('03.14');
  });

  test('size 파라미터를 생략하면 기본값 2를 사용한다', () => {
    expect(fillZero(7)).toBe('07');
  });

  test('value가 지정된 size보다 큰 자릿수를 가지면 원래 값을 그대로 반환한다', () => {
    expect(fillZero(1000, 3)).toBe('1000');
  });
});

describe('formatDate', () => {
  it('날짜를 YYYY-MM-DD 형식으로 포맷팅한다', () => {
    const testDate = new Date('2023-05-10');
    expect(formatDate(testDate)).toBe('2023-05-10');
  });

  it('day 파라미터가 제공되면 해당 일자로 포맷팅한다', () => {
    const testDate = new Date('2023-05-10');
    expect(formatDate(testDate, 15)).toBe('2023-05-15');
  });

  it('월이 한 자리 수일 때 앞에 0을 붙여 포맷팅한다', () => {
    const testDate = new Date('2023-01-20');
    expect(formatDate(testDate)).toBe('2023-01-20');
  });

  it('일이 한 자리 수일 때 앞에 0을 붙여 포맷팅한다', () => {
    const testDate = new Date('2023-12-05');
    expect(formatDate(testDate)).toBe('2023-12-05');
  });
});

describe('createDate', () => {
  test('날짜 문자열을 Date 객체로 변환 (하루 시작)', () => {
    const result = createDate('2025-05-22');

    // 날짜가 정확히 2025-05-22 00:00:00이어야 함
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(4); // 5월은 인덱스 4
    expect(result.getDate()).toBe(22);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  test('날짜 문자열을 Date 객체로 변환 (하루 끝)', () => {
    const result = createDate('2025-05-22', true);

    // 날짜가 정확히 2025-05-22 23:59:59.999여야 함
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(4); // 5월은 인덱스 4
    expect(result.getDate()).toBe(22);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });

  test('각 월의 첫날 테스트', () => {
    // 각 월의 첫날 테스트
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

    months.forEach((month, index) => {
      const result = createDate(`2025-${month}-01`);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(index); // 0-based index
      expect(result.getDate()).toBe(1);
    });
  });

  test('윤년 테스트 (2월 29일)', () => {
    // 2024년은 윤년
    const result = createDate('2024-02-29');

    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1); // 2월은 인덱스 1
    expect(result.getDate()).toBe(29);
  });

  test('월말 테스트', () => {
    const dates = [
      { input: '2025-01-31', month: 0, day: 31 },
      { input: '2025-02-28', month: 1, day: 28 },
      { input: '2024-02-29', month: 1, day: 29 }, // 윤년
      { input: '2025-04-30', month: 3, day: 30 },
      { input: '2025-05-31', month: 4, day: 31 },
    ];

    dates.forEach(({ input, month, day }) => {
      const result = createDate(input);
      expect(result.getMonth()).toBe(month);
      expect(result.getDate()).toBe(day);
    });
  });
});

describe('getLastDateStringOfMonth', () => {
  test('각 월의 마지막 날짜를 문자열로 반환', () => {
    const testCases = [
      { date: new Date(2025, 0, 15), expected: '2025-01-31' }, // 1월
      { date: new Date(2025, 1, 15), expected: '2025-02-28' }, // 2월 (평년)
      { date: new Date(2024, 1, 15), expected: '2024-02-29' }, // 2월 (윤년)
      { date: new Date(2025, 2, 15), expected: '2025-03-31' }, // 3월
      { date: new Date(2025, 3, 15), expected: '2025-04-30' }, // 4월
      { date: new Date(2025, 4, 15), expected: '2025-05-31' }, // 5월
      { date: new Date(2025, 5, 15), expected: '2025-06-30' }, // 6월
      { date: new Date(2025, 6, 15), expected: '2025-07-31' }, // 7월
      { date: new Date(2025, 7, 15), expected: '2025-08-31' }, // 8월
      { date: new Date(2025, 8, 15), expected: '2025-09-30' }, // 9월
      { date: new Date(2025, 9, 15), expected: '2025-10-31' }, // 10월
      { date: new Date(2025, 10, 15), expected: '2025-11-30' }, // 11월
      { date: new Date(2025, 11, 15), expected: '2025-12-31' }, // 12월
    ];

    testCases.forEach(({ date, expected }) => {
      const result = getLastDateStringOfMonth(date);
      expect(result).toBe(expected);
    });
  });

  test('월의 첫날과 마지막날에 대해서도 동일하게 동작', () => {
    // 월의 첫날
    expect(getLastDateStringOfMonth(new Date(2025, 4, 1))).toBe('2025-05-31');

    // 월의 마지막날
    expect(getLastDateStringOfMonth(new Date(2025, 4, 31))).toBe('2025-05-31');
  });

  test('윤년과 평년의 2월 처리', () => {
    // 평년 (2025년)
    expect(getLastDateStringOfMonth(new Date(2025, 1, 15))).toBe('2025-02-28');

    // 윤년 (2024년)
    expect(getLastDateStringOfMonth(new Date(2024, 1, 15))).toBe('2024-02-29');
  });

  test('다양한 날짜 입력에 대한 일관성 테스트', () => {
    // 같은 월의 다른 날짜들에 대해 동일한 결과 반환 확인
    const dates = [1, 5, 10, 15, 20, 25, 28];
    const expected = '2025-05-31';

    dates.forEach((day) => {
      const date = new Date(2025, 4, day); // 2025년 5월
      expect(getLastDateStringOfMonth(date)).toBe(expected);
    });
  });

  test('연도가 바뀌는 경계값 테스트', () => {
    // 12월의 마지막 날짜
    expect(getLastDateStringOfMonth(new Date(2025, 11, 15))).toBe('2025-12-31');

    // 1월의 마지막 날짜
    expect(getLastDateStringOfMonth(new Date(2026, 0, 15))).toBe('2026-01-31');
  });
});

describe('getDateRange', () => {
  describe('Week view 테스트', () => {
    test('주 중간 날짜로 week 범위 계산', () => {
      // 2025-01-15 (수요일)
      const inputDate = new Date(2025, 0, 15, 14, 30, 45);
      const result = getDateRange(inputDate, 'week');

      // 해당 주의 일요일부터 토요일까지
      expect(result.startDate).toEqual(new Date(2025, 0, 12, 0, 0, 0, 0)); // 일요일 00:00:00
      expect(result.endDate).toEqual(new Date(2025, 0, 18, 23, 59, 59, 999)); // 토요일 23:59:59
    });

    test('일요일로 week 범위 계산', () => {
      // 2025-01-12 (일요일)
      const inputDate = new Date(2025, 0, 12, 10, 20, 30);
      const result = getDateRange(inputDate, 'week');

      // 같은 주 일요일부터 토요일까지
      expect(result.startDate).toEqual(new Date(2025, 0, 12, 0, 0, 0, 0)); // 일요일 00:00:00
      expect(result.endDate).toEqual(new Date(2025, 0, 18, 23, 59, 59, 999)); // 토요일 23:59:59
    });

    test('토요일로 week 범위 계산', () => {
      // 2025-01-18 (토요일)
      const inputDate = new Date(2025, 0, 18, 22, 45, 15);
      const result = getDateRange(inputDate, 'week');

      // 같은 주 일요일부터 토요일까지
      expect(result.startDate).toEqual(new Date(2025, 0, 12, 0, 0, 0, 0)); // 일요일 00:00:00
      expect(result.endDate).toEqual(new Date(2025, 0, 18, 23, 59, 59, 999)); // 토요일 23:59:59
    });

    test('월말 주차로 week 범위 계산', () => {
      // 2025-01-29 (수요일, 1월 마지막 주)
      const inputDate = new Date(2025, 0, 29, 9, 15, 30);
      const result = getDateRange(inputDate, 'week');

      // 해당 주 일요일(1월)부터 토요일(2월)까지
      expect(result.startDate).toEqual(new Date(2025, 0, 26, 0, 0, 0, 0)); // 1월 26일 일요일
      expect(result.endDate).toEqual(new Date(2025, 1, 1, 23, 59, 59, 999)); // 2월 1일 토요일
    });

    test('연말 주차로 week 범위 계산', () => {
      // 2024-12-31 (화요일, 연말)
      const inputDate = new Date(2024, 11, 31, 16, 45, 0);
      const result = getDateRange(inputDate, 'week');

      // 해당 주 일요일(12월)부터 토요일(1월)까지
      expect(result.startDate).toEqual(new Date(2024, 11, 29, 0, 0, 0, 0)); // 12월 29일 일요일
      expect(result.endDate).toEqual(new Date(2025, 0, 4, 23, 59, 59, 999)); // 1월 4일 토요일
    });

    test('윤년 2월 마지막 주로 week 범위 계산', () => {
      // 2024-02-29 (목요일, 윤년 2월 마지막 날)
      const inputDate = new Date(2024, 1, 29, 12, 0, 0);
      const result = getDateRange(inputDate, 'week');

      expect(result.startDate).toEqual(new Date(2024, 1, 25, 0, 0, 0, 0)); // 2월 25일 일요일
      expect(result.endDate).toEqual(new Date(2024, 2, 2, 23, 59, 59, 999)); // 3월 2일 토요일
    });
  });

  describe('Month view 테스트', () => {
    test('월 중간 날짜로 month 범위 계산', () => {
      // 2025-01-15 (1월 중간)
      const inputDate = new Date(2025, 0, 15, 14, 30, 45);
      const result = getDateRange(inputDate, 'month');

      // 1월 1일부터 1월 31일까지
      expect(result.startDate).toEqual(new Date(2025, 0, 1, 0, 0, 0, 0)); // 1월 1일 00:00:00
      expect(result.endDate).toEqual(new Date(2025, 0, 31, 23, 59, 59, 999)); // 1월 31일 23:59:59
    });

    test('월 첫날로 month 범위 계산', () => {
      // 2025-01-01 (1월 첫날)
      const inputDate = new Date(2025, 0, 1, 9, 15, 30);
      const result = getDateRange(inputDate, 'month');

      expect(result.startDate).toEqual(new Date(2025, 0, 1, 0, 0, 0, 0)); // 1월 1일 00:00:00
      expect(result.endDate).toEqual(new Date(2025, 0, 31, 23, 59, 59, 999)); // 1월 31일 23:59:59
    });

    test('월 마지막날로 month 범위 계산', () => {
      // 2025-01-31 (1월 마지막날)
      const inputDate = new Date(2025, 0, 31, 23, 45, 15);
      const result = getDateRange(inputDate, 'month');

      expect(result.startDate).toEqual(new Date(2025, 0, 1, 0, 0, 0, 0)); // 1월 1일 00:00:00
      expect(result.endDate).toEqual(new Date(2025, 0, 31, 23, 59, 59, 999)); // 1월 31일 23:59:59
    });

    test('2월 (평년)로 month 범위 계산', () => {
      // 2025-02-15 (평년 2월)
      const inputDate = new Date(2025, 1, 15, 12, 0, 0);
      const result = getDateRange(inputDate, 'month');

      expect(result.startDate).toEqual(new Date(2025, 1, 1, 0, 0, 0, 0)); // 2월 1일 00:00:00
      expect(result.endDate).toEqual(new Date(2025, 1, 28, 23, 59, 59, 999)); // 2월 28일 23:59:59 (평년)
    });

    test('2월 (윤년)로 month 범위 계산', () => {
      // 2024-02-15 (윤년 2월)
      const inputDate = new Date(2024, 1, 15, 18, 30, 45);
      const result = getDateRange(inputDate, 'month');

      expect(result.startDate).toEqual(new Date(2024, 1, 1, 0, 0, 0, 0)); // 2월 1일 00:00:00
      expect(result.endDate).toEqual(new Date(2024, 1, 29, 23, 59, 59, 999)); // 2월 29일 23:59:59 (윤년)
    });

    test('4월 (30일까지)로 month 범위 계산', () => {
      // 2025-04-20 (4월, 30일까지 있는 달)
      const inputDate = new Date(2025, 3, 20, 8, 45, 0);
      const result = getDateRange(inputDate, 'month');

      expect(result.startDate).toEqual(new Date(2025, 3, 1, 0, 0, 0, 0)); // 4월 1일 00:00:00
      expect(result.endDate).toEqual(new Date(2025, 3, 30, 23, 59, 59, 999)); // 4월 30일 23:59:59
    });

    test('12월로 month 범위 계산', () => {
      // 2025-12-25 (연말 12월)
      const inputDate = new Date(2025, 11, 25, 20, 15, 30);
      const result = getDateRange(inputDate, 'month');

      expect(result.startDate).toEqual(new Date(2025, 11, 1, 0, 0, 0, 0)); // 12월 1일 00:00:00
      expect(result.endDate).toEqual(new Date(2025, 11, 31, 23, 59, 59, 999)); // 12월 31일 23:59:59
    });
  });

  describe('시간 정보 처리 테스트', () => {
    test('입력 날짜의 시간 정보가 결과에 영향을 주지 않음 (week)', () => {
      const dates = [
        new Date(2025, 0, 15, 0, 0, 0, 0), // 00:00:00
        new Date(2025, 0, 15, 12, 30, 45, 123), // 12:30:45.123
        new Date(2025, 0, 15, 23, 59, 59, 999), // 23:59:59.999
      ];

      dates.forEach((date) => {
        const result = getDateRange(date, 'week');
        expect(result.startDate).toEqual(new Date(2025, 0, 12, 0, 0, 0, 0));
        expect(result.endDate).toEqual(new Date(2025, 0, 18, 23, 59, 59, 999));
      });
    });

    test('입력 날짜의 시간 정보가 결과에 영향을 주지 않음 (month)', () => {
      const dates = [
        new Date(2025, 0, 15, 0, 0, 0, 0), // 00:00:00
        new Date(2025, 0, 15, 12, 30, 45, 123), // 12:30:45.123
        new Date(2025, 0, 15, 23, 59, 59, 999), // 23:59:59.999
      ];

      dates.forEach((date) => {
        const result = getDateRange(date, 'month');
        expect(result.startDate).toEqual(new Date(2025, 0, 1, 0, 0, 0, 0));
        expect(result.endDate).toEqual(new Date(2025, 0, 31, 23, 59, 59, 999));
      });
    });

    test('startDate는 항상 00:00:00.000으로 설정됨', () => {
      const testCases = [
        { date: new Date(2025, 0, 15), view: 'week' as const },
        { date: new Date(2025, 0, 15), view: 'month' as const },
        { date: new Date(2024, 1, 29), view: 'week' as const },
        { date: new Date(2024, 1, 15), view: 'month' as const },
      ];

      testCases.forEach(({ date, view }) => {
        const result = getDateRange(date, view);
        expect(result.startDate.getHours()).toBe(0);
        expect(result.startDate.getMinutes()).toBe(0);
        expect(result.startDate.getSeconds()).toBe(0);
        expect(result.startDate.getMilliseconds()).toBe(0);
      });
    });

    test('endDate는 항상 23:59:59.999로 설정됨', () => {
      const testCases = [
        { date: new Date(2025, 0, 15), view: 'week' as const },
        { date: new Date(2025, 0, 15), view: 'month' as const },
        { date: new Date(2024, 1, 29), view: 'week' as const },
        { date: new Date(2024, 1, 15), view: 'month' as const },
      ];

      testCases.forEach(({ date, view }) => {
        const result = getDateRange(date, view);
        expect(result.endDate.getHours()).toBe(23);
        expect(result.endDate.getMinutes()).toBe(59);
        expect(result.endDate.getSeconds()).toBe(59);
        expect(result.endDate.getMilliseconds()).toBe(999);
      });
    });
  });

  describe('경계값 테스트', () => {
    test('연도 경계를 넘나드는 week 범위', () => {
      // 2024-12-31 (화요일)
      const inputDate = new Date(2024, 11, 31);
      const result = getDateRange(inputDate, 'week');

      // 2024년 12월 29일부터 2025년 1월 4일까지
      expect(result.startDate.getFullYear()).toBe(2024);
      expect(result.startDate.getMonth()).toBe(11); // 12월
      expect(result.startDate.getDate()).toBe(29);

      expect(result.endDate.getFullYear()).toBe(2025);
      expect(result.endDate.getMonth()).toBe(0); // 1월
      expect(result.endDate.getDate()).toBe(4);
    });

    test('월 경계를 넘나드는 week 범위', () => {
      // 2025-01-31 (금요일)
      const inputDate = new Date(2025, 0, 31);
      const result = getDateRange(inputDate, 'week');

      // 1월 26일부터 2월 1일까지
      expect(result.startDate.getMonth()).toBe(0); // 1월
      expect(result.startDate.getDate()).toBe(26);

      expect(result.endDate.getMonth()).toBe(1); // 2월
      expect(result.endDate.getDate()).toBe(1);
    });

    test('윤년과 평년의 2월 month 범위 차이', () => {
      // 윤년 2월
      const leapYearResult = getDateRange(new Date(2024, 1, 15), 'month');
      expect(leapYearResult.endDate.getDate()).toBe(29); // 2월 29일

      // 평년 2월
      const normalYearResult = getDateRange(new Date(2025, 1, 15), 'month');
      expect(normalYearResult.endDate.getDate()).toBe(28); // 2월 28일
    });
  });

  describe('반환 객체 구조 테스트', () => {
    test('반환 객체가 올바른 구조를 가짐', () => {
      const result = getDateRange(new Date(2025, 0, 15), 'week');

      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(Object.keys(result)).toHaveLength(2);
    });

    test('startDate가 endDate보다 항상 이전임', () => {
      const testCases = [
        { date: new Date(2025, 0, 1), view: 'week' as const },
        { date: new Date(2025, 0, 15), view: 'week' as const },
        { date: new Date(2025, 0, 31), view: 'week' as const },
        { date: new Date(2025, 0, 1), view: 'month' as const },
        { date: new Date(2025, 0, 15), view: 'month' as const },
        { date: new Date(2025, 0, 31), view: 'month' as const },
      ];

      testCases.forEach(({ date, view }) => {
        const result = getDateRange(date, view);
        expect(result.startDate.getTime()).toBeLessThan(result.endDate.getTime());
      });
    });
  });

  describe('다양한 연도 테스트', () => {
    test('과거 연도 처리', () => {
      const result = getDateRange(new Date(2020, 5, 15), 'month'); // 2020년 6월
      expect(result.startDate).toEqual(new Date(2020, 5, 1, 0, 0, 0, 0));
      expect(result.endDate).toEqual(new Date(2020, 5, 30, 23, 59, 59, 999)); // 6월은 30일까지
    });

    test('미래 연도 처리', () => {
      const result = getDateRange(new Date(2030, 2, 10), 'week'); // 2030년 3월
      // 2030-03-10은 일요일
      expect(result.startDate).toEqual(new Date(2030, 2, 10, 0, 0, 0, 0));
      expect(result.endDate).toEqual(new Date(2030, 2, 16, 23, 59, 59, 999));
    });
  });
});
