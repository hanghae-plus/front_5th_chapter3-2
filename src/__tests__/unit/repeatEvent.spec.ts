import { generateRepeatDates } from '../../utils/repeatUtils';

describe('generateRepeatDates', () => {
  it('매일 반복일정을 생성한다.', () => {
    const result = generateRepeatDates(new Date('2025-05-01'), 'daily', 1, new Date('2025-05-03'));
    expect(result).toEqual(['2025-05-01', '2025-05-02', '2025-05-03']);
  });

  it('매주 반복일정을 생성한다.', () => {
    const result = generateRepeatDates(new Date('2025-05-01'), 'weekly', 1, new Date('2025-05-29'));
    expect(result).toEqual(['2025-05-01', '2025-05-08', '2025-05-15', '2025-05-22', '2025-05-29']);
  });

  it('매월 반복일정을 생성한다.', () => {
    const result = generateRepeatDates(
      new Date('2025-01-31'),
      'monthly',
      1,
      new Date('2025-04-30')
    );
    expect(result).toEqual(['2025-01-31', '2025-02-28', '2025-03-31', '2025-04-30']);
  });

  it('매년 반복일정을 생성한다.', () => {
    const result = generateRepeatDates(new Date('2022-10-15'), 'yearly', 1, new Date('2025-10-15'));
    expect(result).toEqual(['2022-10-15', '2023-10-15', '2024-10-15', '2025-10-15']);
  });

  it('매일 반복 + 간격 2', () => {
    const result = generateRepeatDates(new Date('2025-05-01'), 'daily', 2, new Date('2025-05-07'));
    expect(result).toEqual(['2025-05-01', '2025-05-03', '2025-05-05', '2025-05-07']);
  });

  it('매주 반복 + 간격 2', () => {
    const result = generateRepeatDates(new Date('2025-05-01'), 'weekly', 2, new Date('2025-06-12'));
    expect(result).toEqual(['2025-05-01', '2025-05-15', '2025-05-29', '2025-06-12']);
  });

  it('매월 반복 + 간격 2', () => {
    const result = generateRepeatDates(
      new Date('2025-01-31'),
      'monthly',
      2,
      new Date('2025-07-31')
    );
    expect(result).toEqual(['2025-01-31', '2025-03-31', '2025-05-31', '2025-07-31']);
  });

  it('매년 반복 + 간격 2', () => {
    const result = generateRepeatDates(new Date('2020-05-01'), 'yearly', 2, new Date('2026-05-01'));
    expect(result).toEqual(['2020-05-01', '2022-05-01', '2024-05-01', '2026-05-01']);
  });

  it('종료조건이 날짜일 경우 그 날짜까지 생성된다.', () => {
    const result = generateRepeatDates(new Date('2025-05-01'), 'daily', 1, new Date('2025-05-03'));
    expect(result).toEqual(['2025-05-01', '2025-05-02', '2025-05-03']);
  });

  it('종료조건이 횟수일 경우 해당 횟수만큼 생성된다.', () => {
    const result = generateRepeatDates(new Date('2025-05-01'), 'daily', 1, undefined, 3);
    expect(result).toEqual(['2025-05-01', '2025-05-02', '2025-05-03']);
  });

  it('종료조건이 없음이면 2025-09-30까지 생성된다.', () => {
    const result = generateRepeatDates(
      new Date('2025-09-27'),
      'daily',
      1,
      undefined,
      undefined,
      new Date('2025-09-30')
    );
    expect(result).toEqual(['2025-09-27', '2025-09-28', '2025-09-29', '2025-09-30']);
  });

  it('2월 29일 윤년 반복은 윤년에서만 생성된다.', () => {
    const result = generateRepeatDates(new Date('2024-02-29'), 'yearly', 1, new Date('2032-12-31'));
    expect(result).toEqual(['2024-02-29', '2028-02-29', '2032-02-29']);
  });
});
