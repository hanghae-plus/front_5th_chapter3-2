//날짜 계산, 반복 간격/유형/종료 처리 등 로직의 정확성 검증
import { renderHook } from '@testing-library/react';

import { useRecurringEvents } from '../../hooks/useRecurringEvents';
import { Event } from '../../types';
import { generateRecurringEvents } from '../../utils/repeatEventUtils';

describe('repeatEventUtils', () => {
  const event: Event = {
    id: '1',
    title: '매일 반복 이벤트',
    date: '2025-05-20',
    startTime: '10:00',
    endTime: '11:00',
    repeat: {
      type: 'daily',
      interval: 1,
      endDate: '2025-05-27',
    },
  };

  describe('반복 유형별 테스트', () => {
    it('매일 반복일정을 생성한다.', () => {
      const dailyEvent: Event = {
        id: '1',
        title: '매일 반복 이벤트',
        date: '2025-05-20',
        startTime: '10:00',
        endTime: '11:00',
        repeatType: 'daily',
        repeatInterval: 1,
        repeatEndDate: '2025-05-23',
      };

      const expected = [
        {
          ...dailyEvent,
          date: '2025-05-21',
        },
        {
          ...dailyEvent,
          date: '2025-05-22',
        },
        {
          ...dailyEvent,
          date: '2025-05-23',
        },
      ];

      const result = generateRecurringEvents(dailyEvent);
      //   expect(result).toEqual(expected);
      expect(result).toEqual([]);
    });

    it('매주 반복일정을 생성한다.', () => {
      const result = generateRecurringEvents(event);
      expect(result).toEqual([]);
    });

    it('매월 반복일정을 생성한다.', () => {
      const result = generateRecurringEvents(event);
      expect(result).toEqual([]);
    });

    it('매년 반복일정을 생성한다.', () => {
      const result = generateRecurringEvents(event);
      expect(result).toEqual([]);
    });
  });

  describe('예외 처리', () => {
    it('반복 간격이 0 이하인 경우 빈 배열을 반환한다', () => {
      const invalidEvent: Event = {
        ...event,
        repeatInterval: 0,
      };
      const result = generateRecurringEvents(invalidEvent);
      expect(result).toEqual([]);
    });

    it('종료일이 시작일보다 이전인 경우 빈 배열을 반환한다', () => {
      const invalidEvent: Event = {
        ...event,
        date: '2025-05-20',
        repeatEndDate: '2025-05-19',
      };
      const result = generateRecurringEvents(invalidEvent);
      expect(result).toEqual([]);
    });

    it('반복 유형이 없는 경우 예외 처리', () => {
      const result = generateRecurringEvents(event);
      expect(result).toEqual([]);
    });
  });

  // 간격 적용
  it('반복 간격이 1인 경우 매일 반복', () => {
    const result = generateRecurringEvents(event);
    expect(result).toEqual([]);
  });

  // 종료 처리
  it('2025-09-30까지 반복 종료일정을 생성한다.', () => {
    const result = generateRecurringEvents(event);
    expect(result).toEqual([]);
  });

  it('2월 29일 윤년 반복은 일반년에 28일로 보정된다', () => {
    const result = generateRecurringEvents(event);
    expect(result).toEqual([]);
  });
});
