import { createDate } from '../../utils/dateUtils';
import { RecurRule } from '../../utils/recur-rule';

describe('RecurRule', () => {
  describe('생성자 유효성 검사', () => {
    test('잘못된 frequency로 생성 시 에러 발생', () => {
      expect(() => {
        new RecurRule({
          frequency: 'invalid' as any,
          interval: 1,
          start: createDate('2025-01-01'),
          until: createDate('2025-11-31'),
        });
      }).toThrow('유효한 frequency가 필요합니다');
    });

    test('잘못된 interval로 생성 시 에러 발생', () => {
      expect(() => {
        new RecurRule({
          frequency: 'daily',
          interval: 0,
          start: createDate('2025-01-01'),
          until: createDate('2025-11-31'),
        });
      }).toThrow('interval은 1 이상의 정수여야 합니다');
    });

    test('until과 count 둘 다 설정 시 에러 발생', () => {
      expect(() => {
        new RecurRule({
          frequency: 'daily',
          interval: 1,
          start: createDate('2025-01-01'),
          until: createDate('2025-11-31'),
          count: 10,
        });
      }).toThrow('until과 count 중 하나만 설정할 수 있습니다');
    });

    test('until과 count 둘 다 없으면 에러 발생', () => {
      expect(() => {
        new RecurRule({
          frequency: 'daily',
          interval: 1,
          start: createDate('2025-01-01'),
        });
      }).toThrow('until 또는 count 중 하나는 반드시 설정해야 합니다');
    });

    test('start가 until보다 늦으면 에러 발생', () => {
      expect(() => {
        new RecurRule({
          frequency: 'daily',
          interval: 1,
          start: createDate('2025-11-31'),
          until: createDate('2025-01-01'),
        });
      }).toThrow('start 날짜는 until 날짜보다 이전이어야 합니다');
    });

    test('잘못된 count 값으로 생성 시 에러 발생', () => {
      expect(() => {
        new RecurRule({
          frequency: 'daily',
          interval: 1,
          start: createDate('2025-01-01'),
          count: 0,
        });
      }).toThrow('count는 1 이상의 정수여야 합니다');
    });
  });

  describe('Daily 반복 (날짜 기반)', () => {
    test('매일 반복', () => {
      const rule = new RecurRule({
        frequency: 'daily',
        interval: 1,
        start: createDate('2025-01-01'), // 2025-01-01
        until: createDate('2025-01-05'), // 2025-01-05
      });

      const dates = rule.all();
      expect(dates).toHaveLength(5);
      expect(dates[0]).toEqual(new Date(2025, 0, 1));
      expect(dates[4]).toEqual(new Date(2025, 0, 5));
    });

    test('격일 반복', () => {
      const rule = new RecurRule({
        frequency: 'daily',
        interval: 2,
        start: createDate('2025-01-01'), // 2025-01-01
        until: createDate('2025-01-10'), // 2025-01-10
      });

      const dates = rule.all();
      expect(dates).toHaveLength(5);
      expect(dates[0]).toEqual(new Date(2025, 0, 1)); // 1일
      expect(dates[1]).toEqual(new Date(2025, 0, 3)); // 3일
      expect(dates[2]).toEqual(new Date(2025, 0, 5)); // 5일
      expect(dates[3]).toEqual(new Date(2025, 0, 7)); // 7일
      expect(dates[4]).toEqual(new Date(2025, 0, 9)); // 9일
    });

    test('특정 범위 내 daily 반복', () => {
      const rule = new RecurRule({
        frequency: 'daily',
        interval: 1,
        start: createDate('2025-01-01'), // 2025-01-01
        until: createDate('2025-01-10'), // 2025-01-10
      });

      const dates = rule.between(new Date(2025, 0, 3), new Date(2025, 0, 7));
      expect(dates).toHaveLength(5);
      expect(dates[0]).toEqual(new Date(2025, 0, 3));
      expect(dates[4]).toEqual(new Date(2025, 0, 7));
    });
  });

  describe('Daily 반복 (횟수 기반)', () => {
    test('매일 5번 반복', () => {
      const rule = new RecurRule({
        frequency: 'daily',
        interval: 1,
        start: createDate('2025-01-01'),
        count: 5,
      });

      const dates = rule.all();
      expect(dates).toHaveLength(5);
      expect(dates[0]).toEqual(new Date(2025, 0, 1));
      expect(dates[4]).toEqual(new Date(2025, 0, 5));
    });

    test('격일 3번 반복', () => {
      const rule = new RecurRule({
        frequency: 'daily',
        interval: 2,
        start: createDate('2025-01-01'),
        count: 3,
      });

      const dates = rule.all();
      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new Date(2025, 0, 1)); // 1일
      expect(dates[1]).toEqual(new Date(2025, 0, 3)); // 3일
      expect(dates[2]).toEqual(new Date(2025, 0, 5)); // 5일
    });

    test('byCount 메서드 직접 호출', () => {
      const rule = new RecurRule({
        frequency: 'daily',
        interval: 1,
        start: createDate('2025-01-01'),
        count: 10, // 기본값
      });

      const dates = rule.byCount(3); // 3번만 반복
      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new Date(2025, 0, 1));
      expect(dates[2]).toEqual(new Date(2025, 0, 3));
    });
  });

  describe('Weekly 반복', () => {
    test('매주 반복', () => {
      const rule = new RecurRule({
        frequency: 'weekly',
        interval: 1,
        start: createDate('2025-01-06'), // 2025-01-06 (월요일)
        until: createDate('2025-01-27'), // 2025-01-27
      });

      const dates = rule.all();
      expect(dates).toHaveLength(4);
      expect(dates[0]).toEqual(new Date(2025, 0, 6)); // 1월 6일
      expect(dates[1]).toEqual(new Date(2025, 0, 13)); // 1월 13일
      expect(dates[2]).toEqual(new Date(2025, 0, 20)); // 1월 20일
      expect(dates[3]).toEqual(new Date(2025, 0, 27)); // 1월 27일
    });

    test('격주 반복', () => {
      const rule = new RecurRule({
        frequency: 'weekly',
        interval: 2,
        start: createDate('2025-01-06'), // 2025-01-06 (월요일)
        until: createDate('2025-02-17'), // 2025-02-17
      });

      const dates = rule.all();
      expect(dates).toHaveLength(4);
      expect(dates[0]).toEqual(new Date(2025, 0, 6)); // 1월 6일
      expect(dates[1]).toEqual(new Date(2025, 0, 20)); // 1월 20일
      expect(dates[2]).toEqual(new Date(2025, 1, 3)); // 2월 3일
      expect(dates[3]).toEqual(new Date(2025, 1, 17)); // 2월 17일
    });

    test('주간 반복 횟수 기반', () => {
      const rule = new RecurRule({
        frequency: 'weekly',
        interval: 1,
        start: createDate('2025-01-06'), // 월요일
        count: 3,
      });

      const dates = rule.all();
      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new Date(2025, 0, 6));
      expect(dates[1]).toEqual(new Date(2025, 0, 13));
      expect(dates[2]).toEqual(new Date(2025, 0, 20));
    });
  });

  describe('Monthly 반복', () => {
    test('매월 n번째 요일 반복', () => {
      const rule = new RecurRule({
        frequency: 'monthly',
        interval: 1,
        start: createDate('2025-01-06'), // 2025-01-06 (1월 첫 번째 월요일)
        until: createDate('2025-03-31'), // 2025-03-31
      });

      const dates = rule.all();
      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(createDate('2025-01-06')); // 1월 첫 번째 월요일
      expect(dates[1]).toEqual(createDate('2025-02-03')); // 2월 첫 번째 월요일
      expect(dates[2]).toEqual(createDate('2025-03-03')); // 3월 첫 번째 월요일
    });

    test('매월 마지막 요일 반복', () => {
      const rule = new RecurRule({
        frequency: 'monthly',
        interval: 1,
        start: createDate('2025-01-27'), // 2025-01-27 (1월 마지막 월요일)
        until: createDate('2025-03-31'), // 2025-03-31
      });

      const dates = rule.all();
      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new Date(2025, 0, 27)); // 1월 마지막 월요일
      expect(dates[1]).toEqual(new Date(2025, 1, 24)); // 2월 마지막 월요일
      expect(dates[2]).toEqual(new Date(2025, 2, 31)); // 3월 마지막 월요일
    });

    test('격월 반복', () => {
      const rule = new RecurRule({
        frequency: 'monthly',
        interval: 2,
        start: createDate('2025-01-15'), // 2025-01-15
        until: createDate('2025-05-31'), // 2025-05-31
      });

      const dates = rule.all();
      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new Date(2025, 0, 15)); // 1월
      expect(dates[1]).toEqual(new Date(2025, 2, 19)); // 3월 (격월)
      expect(dates[2]).toEqual(new Date(2025, 4, 21)); // 5월 (격월)
    });

    test('월별 반복 횟수 기반', () => {
      const rule = new RecurRule({
        frequency: 'monthly',
        interval: 1,
        start: createDate('2025-01-15'),
        count: 4,
      });

      const dates = rule.all();
      expect(dates).toHaveLength(4);
      expect(dates[0]).toEqual(new Date(2025, 0, 15)); // 1월
      expect(dates[1]).toEqual(new Date(2025, 1, 19)); // 2월
      expect(dates[2]).toEqual(new Date(2025, 2, 19)); // 3월
      expect(dates[3]).toEqual(new Date(2025, 3, 16)); // 4월
    });

    test('매월 마지막 요일 반복 (원래 5번째였던 케이스)', () => {
      const rule = new RecurRule({
        frequency: 'monthly',
        interval: 1,
        start: createDate('2025-01-29'), // 1월 마지막 수요일 (5번째이기도 함)
        until: createDate('2025-03-31'),
      });

      const dates = rule.all();
      // 마지막 수요일로 처리되므로 모든 월에 포함
      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new Date(2025, 0, 29)); // 1월 마지막 수요일
      expect(dates[1]).toEqual(new Date(2025, 1, 26)); // 2월 마지막 수요일
      expect(dates[2]).toEqual(new Date(2025, 2, 26)); // 3월 마지막 수요일
    });
  });

  describe('Yearly 반복', () => {
    test('매년 반복', () => {
      const rule = new RecurRule({
        frequency: 'yearly',
        interval: 1,
        start: createDate('2025-02-14'), // 2025-02-14
        until: createDate('2028-02-14'), // 2028-02-14
      });

      const dates = rule.all();
      expect(dates).toHaveLength(4);
      expect(dates[0]).toEqual(new Date(2025, 1, 14));
      expect(dates[1]).toEqual(new Date(2026, 1, 14));
      expect(dates[2]).toEqual(new Date(2027, 1, 14));
      expect(dates[3]).toEqual(new Date(2028, 1, 14));
    });

    test('2년마다 반복', () => {
      const rule = new RecurRule({
        frequency: 'yearly',
        interval: 2,
        start: createDate('2025-07-04'), // 2025-07-04
        until: createDate('2031-07-04'), // 2031-07-04
      });

      const dates = rule.all();
      expect(dates).toHaveLength(4);
      expect(dates[0]).toEqual(new Date(2025, 6, 4));
      expect(dates[1]).toEqual(new Date(2027, 6, 4));
      expect(dates[2]).toEqual(new Date(2029, 6, 4));
      expect(dates[3]).toEqual(new Date(2031, 6, 4));
    });

    test('윤년 2월 29일 처리', () => {
      const rule = new RecurRule({
        frequency: 'yearly',
        interval: 1,
        start: createDate('2024-02-29'), // 2024-02-29 (윤년)
        until: createDate('2030-02-29'), // 2030-02-29
      });

      const dates = rule.all();
      // 2024, 2028만 윤년이므로 2번만 발생
      expect(dates).toHaveLength(2);
      expect(dates[0]).toEqual(new Date(2024, 1, 29));
      expect(dates[1]).toEqual(new Date(2028, 1, 29));
    });

    test('연별 반복 횟수 기반', () => {
      const rule = new RecurRule({
        frequency: 'yearly',
        interval: 1,
        start: createDate('2025-12-25'), // 크리스마스
        count: 5,
      });

      const dates = rule.all();
      expect(dates).toHaveLength(5);
      expect(dates[0]).toEqual(new Date(2025, 11, 25));
      expect(dates[4]).toEqual(new Date(2029, 11, 25));
    });
  });

  describe('범위 밖 요청 처리', () => {
    test('범위 밖 시작일로 between 호출', () => {
      const rule = new RecurRule({
        frequency: 'daily',
        interval: 1,
        start: createDate('2025-01-10'),
        until: createDate('2025-01-20'),
      });

      // 반복 시작일 이전 범위 요청
      const dates1 = rule.between(new Date(2025, 0, 1), new Date(2025, 0, 5));
      expect(dates1).toHaveLength(0);

      // 반복 종료일 이후 범위 요청
      const dates2 = rule.between(new Date(2025, 0, 25), new Date(2025, 0, 30));
      expect(dates2).toHaveLength(0);

      // 일부 겹치는 범위 요청
      const dates3 = rule.between(new Date(2025, 0, 15), new Date(2025, 0, 25));
      expect(dates3).toHaveLength(6); // 15일부터 20일까지
    });
  });

  describe('에러 케이스', () => {
    test('잘못된 날짜로 between 호출', () => {
      const rule = new RecurRule({
        frequency: 'daily',
        interval: 1,
        start: createDate('2025-01-01'),
        until: createDate('2025-01-10'),
      });

      expect(() => {
        rule.between(new Date('invalid'), new Date(2025, 0, 5));
      }).toThrow('유효한 start 날짜가 필요합니다');

      expect(() => {
        rule.between(new Date(2025, 0, 1), new Date('invalid'));
      }).toThrow('유효한 end 날짜가 필요합니다');
    });

    test('잘못된 count로 byCount 호출', () => {
      const rule = new RecurRule({
        frequency: 'daily',
        interval: 1,
        start: createDate('2025-01-01'),
        count: 10,
      });

      expect(() => {
        rule.byCount(0);
      }).toThrow('count는 1 이상의 정수여야 합니다');

      expect(() => {
        rule.byCount(-1);
      }).toThrow('count는 1 이상의 정수여야 합니다');
    });
  });

  describe('특수 케이스', () => {
    test('시작일과 종료일이 같은 경우', () => {
      const rule = new RecurRule({
        frequency: 'daily',
        interval: 1,
        start: createDate('2025-01-01'),
        until: createDate('2025-01-01'),
      });

      const dates = rule.all();
      expect(dates).toHaveLength(1);
      expect(dates[0]).toEqual(new Date(2025, 0, 1));
    });

    test('count가 1인 경우', () => {
      const rule = new RecurRule({
        frequency: 'weekly',
        interval: 2,
        start: createDate('2025-01-01'),
        count: 1,
      });

      const dates = rule.all();
      expect(dates).toHaveLength(1);
      expect(dates[0]).toEqual(new Date(2025, 0, 1));
    });

    test('큰 interval 값', () => {
      const rule = new RecurRule({
        frequency: 'daily',
        interval: 100,
        start: createDate('2025-01-01'),
        count: 3,
      });

      const dates = rule.all();
      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new Date(2025, 0, 1));
      expect(dates[1]).toEqual(new Date(2025, 3, 11)); // 100일 후
      expect(dates[2]).toEqual(new Date(2025, 6, 20)); // 200일 후
    });
  });
});
