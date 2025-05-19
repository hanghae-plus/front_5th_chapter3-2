import {
  generateDailyRepeats,
  generateMonthlyRepeats,
  generateWeeklyRepeats,
  generateYearlyRepeats,
} from '../utils/repeatUtils';

describe('반복 유형 선택', () => {
  it('29일에 매년 반복 신청을 하면 윤년인 해에만 일정이 생성된다.', () => {
    const startDate = new Date('2024-02-29');
    const endDate = new Date('2032-12-29');

    const result = generateYearlyRepeats(startDate, endDate);
    const dates = result.map((d) => d.toISOString().slice(0, 10));

    expect(dates).toEqual(['2024-02-29', '2028-02-29', '2032-02-29']);
  });

  it('31일에 매월 반복 신청을 하면 31일이 없는 달은 일정을 생성하지 않는다.', () => {
    const startDate = new Date('2025-1-31');
    const endDate = new Date('2025-06-30');

    const result = generateMonthlyRepeats(startDate, endDate, 1);
    const dates = result.map((d) => d.toISOString().slice(0, 10));

    expect(dates).toEqual(['2025-01-31', '2025-03-31', '2025-05-31']);
  });
});

describe('반복 간격 설정', () => {
  it('2일마다 반복 주기의 간격을 지정할 수 있다.', () => {
    const startDate = new Date('2025-05-19');
    const endDate = new Date('2025-05-30');
    const result = generateDailyRepeats(startDate, endDate, 2);
    const dates = result.map((d) => d.toISOString().slice(0, 10));

    expect(dates.length).toBe(6);
  });

  it('2주마다 반복 주기의 간격을 지정할 수 있다.', () => {
    const startDate = new Date('2025-05-19');
    const endDate = new Date('2025-06-30');

    const result = generateWeeklyRepeats(startDate, endDate, 2);
    const dates = result.map((d) => d.toISOString().slice(0, 10));

    expect(dates.length).toBe(4);
  });

  it('3개월마다 반복 주기의 간격을 선택할 수 있다.', () => {
    const startDate = new Date('2025-05-19');
    const endDate = new Date('2025-12-30');

    const result = generateMonthlyRepeats(startDate, endDate, 3);
    const dates = result.map((d) => d.toISOString().slice(0, 10));

    expect(dates.length).toBe(3);
  });
});
