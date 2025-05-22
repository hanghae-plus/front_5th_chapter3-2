import { getRepeatDates } from '../../utils/repeatUtils';

// 예제 특성상, 2025년 6월 30일까지
describe('getRepeatDates', () => {
  it('반복되는 일정이 Daily + 1일간격 일 경우 매일 날짜를 반환한다.', () => {
    const today = new Date('2025-05-01');
    const repeatOptions = {
      type: 'daily',
      interval: 1,
    };
    const repeatDates = getRepeatDates(today, repeatOptions);
    expect(repeatDates).toEqual([
      '2025-05-01',
      '2025-05-02',
      '2025-05-03',
      '2025-05-04',
      '2025-05-05',
      '2025-05-06',
      '2025-05-07',
      '2025-05-08',
      '2025-05-09',
      '2025-05-10',
      '2025-05-11',
      '2025-05-12',
      '2025-05-13',
      '2025-05-14',
      '2025-05-15',
      '2025-05-16',
      '2025-05-17',
      '2025-05-18',
      '2025-05-19',
      '2025-05-20',
      '2025-05-21',
      '2025-05-22',
      '2025-05-23',
      '2025-05-24',
      '2025-05-25',
      '2025-05-26',
      '2025-05-27',
      '2025-05-28',
      '2025-05-29',
      '2025-05-30',
      '2025-05-31',
      '2025-06-01',
      '2025-06-02',
      '2025-06-03',
      '2025-06-04',
      '2025-06-05',
      '2025-06-06',
      '2025-06-07',
      '2025-06-08',
      '2025-06-09',
      '2025-06-10',
      '2025-06-11',
      '2025-06-12',
      '2025-06-13',
      '2025-06-14',
      '2025-06-15',
      '2025-06-16',
      '2025-06-17',
      '2025-06-18',
      '2025-06-19',
      '2025-06-20',
      '2025-06-21',
      '2025-06-22',
      '2025-06-23',
      '2025-06-24',
      '2025-06-25',
      '2025-06-26',
      '2025-06-27',
      '2025-06-28',
      '2025-06-29',
      '2025-06-30',
    ]);
  });

  it('반복되는 일정이 Daily + 3일간격 일 경우 3일간격으로 날짜를 반환한다.', () => {
    const today = new Date('2025-05-01');
    const repeatOptions = {
      type: 'daily',
      interval: 3,
    };
    const repeatDates = getRepeatDates(today, repeatOptions);
    expect(repeatDates).toEqual([
      '2025-05-01',
      '2025-05-04',
      '2025-05-07',
      '2025-05-10',
      '2025-05-13',
      '2025-05-16',
      '2025-05-19',
      '2025-05-22',
      '2025-05-25',
      '2025-05-28',
      '2025-05-31',
      '2025-06-03',
      '2025-06-06',
      '2025-06-09',
      '2025-06-12',
      '2025-06-15',
      '2025-06-18',
      '2025-06-21',
      '2025-06-24',
      '2025-06-27',
      '2025-06-30',
    ]);
  });

  it('반복되는 일정이 Weekly + 1주일간격 일 경우 매주 날짜를 반환한다.', () => {
    const today = new Date('2025-05-01');
    const repeatOptions = {
      type: 'weekly',
      interval: 1,
    };
    const repeatDates = getRepeatDates(today, repeatOptions);
    expect(repeatDates).toEqual([
      '2025-05-01',
      '2025-05-08',
      '2025-05-15',
      '2025-05-22',
      '2025-05-29',
      '2025-06-05',
      '2025-06-12',
      '2025-06-19',
      '2025-06-26',
    ]);
  });

  it('반복되는 일정이 Weekly + 2주일간격 일 경우 매주 날짜를 반환한다.', () => {
    const today = new Date('2025-05-01');
    const repeatOptions = {
      type: 'weekly',
      interval: 2,
    };
    const repeatDates = getRepeatDates(today, repeatOptions);
    expect(repeatDates).toEqual([
      '2025-05-01',
      '2025-05-15',
      '2025-05-29',
      '2025-06-12',
      '2025-06-26',
    ]);
  });

  it('반복되는 일정이 Monthly + 1달 간격 일 경우 매월 날짜를 반환한다.', () => {
    const today = new Date('2025-05-01');
    const repeatOptions = {
      type: 'monthly',
      interval: 1,
    };
    const repeatDates = getRepeatDates(today, repeatOptions);
    expect(repeatDates).toEqual(['2025-05-01', '2025-06-01']);
  });

  it('반복되는 일정이 Monthly + 2달 간격 일 경우 매월 날짜를 반환한다.', () => {
    const today = new Date('2025-05-01');
    const repeatOptions = {
      type: 'monthly',
      interval: 2,
    };
    const repeatDates = getRepeatDates(today, repeatOptions);
    expect(repeatDates).toEqual(['2025-05-01']);
  });

  it('반복되는 일정이 Yearly + 1년 간격 일 경우 매년 날짜를 반환한다.', () => {
    const today = new Date('2025-05-01');
    const repeatOptions = {
      type: 'Yearly',
      interval: 1,
    };
    const repeatDates = getRepeatDates(today, repeatOptions);
    expect(repeatDates).toEqual(['2025-05-01']);
  });

  it('반복되는 일자가 31일인 경우 31일이 없는 날은 반환 하지 않는다.', () => {
    const today = new Date('2025-05-31');
    const repeatOptions = {
      type: 'monthly',
      interval: 1,
    };
    const repeatDates = getRepeatDates(today, repeatOptions);
    expect(repeatDates).toEqual(['2025-05-31']);
  });

  it('반복되는 일자가 29일인 경우 29일이 없는 날은 반환 하지 않는다.', () => {
    const today = new Date('2024-02-29');
    const repeatOptions = {
      type: 'monthly',
      interval: 1,
    };
    const repeatDates = getRepeatDates(today, repeatOptions);
    expect(repeatDates).toEqual([
      '2024-02-29',
      '2024-03-29',
      '2024-04-29',
      '2024-05-29',
      '2024-06-29',
      '2024-07-29',
      '2024-08-29',
      '2024-09-29',
      '2024-10-29',
      '2024-11-29',
      '2024-12-29',
      '2025-01-29',
      '2025-03-29',
      '2025-04-29',
      '2025-05-29',
      '2025-06-29',
    ]);
  });

  it('종료일이 존재한다면 해당 종료일 까지만 반복 한다.', () => {
    const today = new Date('2025-05-05');
    const endDate = new Date('2025-06-30');
    const repeatOptions = {
      type: 'monthly',
      interval: 1,
      endDate,
    };
    const repeatDates = getRepeatDates(today, repeatOptions);
    expect(repeatDates).toEqual(['2025-05-05', '2025-06-05']);
  });
});
