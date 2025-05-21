import { generateRepeatDatesFromEvent } from '../../utils/repeatUtils';

describe('generateRepeatDatesFromEvent', () => {
  it('none 타입이면 빈 배열 반환', () => {
    const result = generateRepeatDatesFromEvent('2025-05-01', {
      type: 'none',
      interval: 1,
    });
    expect(result).toEqual([]);
  });

  it('종료일 없이도 none 타입은 빈 배열', () => {
    const result = generateRepeatDatesFromEvent('2025-05-01', {
      type: 'daily',
      interval: 1,
    });
    expect(result).toEqual([]);
  });

  it('매일 반복 2일 간격으로 종료일까지 날짜 생성', () => {
    const result = generateRepeatDatesFromEvent('2025-05-01', {
      type: 'daily',
      interval: 2,
      endDate: '2025-05-07',
    });
    expect(result).toEqual(['2025-05-01', '2025-05-03', '2025-05-05', '2025-05-07']);
  });

  it('매주 반복 1주일 간격으로 종료일까지 날짜 생성', () => {
    const result = generateRepeatDatesFromEvent('2025-05-01', {
      type: 'weekly',
      interval: 1,
      endDate: '2025-05-22',
    });
    expect(result).toEqual(['2025-05-01', '2025-05-08', '2025-05-15', '2025-05-22']);
  });

  it('매월 반복 1개월 간격으로 종료일까지 날짜 생성 (31일 → 말일 처리 확인)', () => {
    const result = generateRepeatDatesFromEvent('2025-01-31', {
      type: 'monthly',
      interval: 1,
      endDate: '2025-04-30',
    });
    expect(result).toEqual(['2025-01-31', '2025-02-28', '2025-03-31', '2025-04-30']);
  });

  it('매년 반복 1년 간격으로 종료일까지 날짜 생성 (윤년 2월 29일 처리 확인)', () => {
    const result = generateRepeatDatesFromEvent('2020-02-29', {
      type: 'yearly',
      interval: 1,
      endDate: '2025-03-01',
    });
    expect(result).toEqual([
      '2020-02-29',
      '2021-02-28',
      '2022-02-28',
      '2023-02-28',
      '2024-02-29',
      '2025-02-28',
    ]);
  });
});
