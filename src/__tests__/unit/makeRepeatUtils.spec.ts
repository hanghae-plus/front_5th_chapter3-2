import { Event, RepeatType } from '../../types';
import { makeRepeatEventList } from '../../utils/makeRepeatUtils';

describe('makeRepeatEventList', () => {
  const baseEvent: Event = {
    id: '1',
    title: '테스트 일정',
    date: '2024-03-01',
    startTime: '10:00',
    endTime: '11:00',
    description: '테스트 설명',
    location: '테스트 장소',
    category: '테스트',
    repeat: {
      type: 'none',
      interval: 1,
    },
    notificationTime: 10,
  };

  describe('반복 유형 선택', () => {
    it('매일 반복 일정이 올바르게 생성되어야 한다', () => {
      const event = {
        ...baseEvent,
        repeat: {
          type: 'daily' as RepeatType,
          interval: 1,
          endDate: '2024-03-03',
        },
      };

      const result = makeRepeatEventList(event);
      expect(result).toHaveLength(3); // 3/1, 3/2, 3/3
      console.log(result);
      // 날짜 검증
      expect(result[0].date).toBe('2024-03-01');
      expect(result[1].date).toBe('2024-03-02');
      expect(result[2].date).toBe('2024-03-03');

      // id 검증
      const ids = result.map((event) => event.id);
      expect(new Set(ids).size).toBe(3); // 모든 id가 고유한지 확인
    });

    it('매주 반복 일정이 올바르게 생성되어야 한다', () => {
      const event = {
        ...baseEvent,
        repeat: {
          type: 'weekly' as RepeatType,
          interval: 1,
          endDate: '2024-03-22',
        },
      };

      const result = makeRepeatEventList(event);
      expect(result).toHaveLength(4); // 3/1, 3/8, 3/15, 3/22

      // 날짜 검증
      expect(result[0].date).toBe('2024-03-01');
      expect(result[1].date).toBe('2024-03-08');
      expect(result[2].date).toBe('2024-03-15');
      expect(result[3].date).toBe('2024-03-22');

      // id 검증
      const ids = result.map((event) => event.id);
      expect(new Set(ids).size).toBe(4); // 모든 id가 고유한지 확인
    });

    it('매월 반복 일정이 올바르게 생성되어야 한다', () => {
      const event = {
        ...baseEvent,
        repeat: {
          type: 'monthly' as RepeatType,
          interval: 1,
          endDate: '2024-05-01',
        },
      };

      const result = makeRepeatEventList(event);
      expect(result).toHaveLength(3); // 3/1, 4/1, 5/1

      // 날짜 검증
      expect(result[0].date).toBe('2024-03-01');
      expect(result[1].date).toBe('2024-04-01');
      expect(result[2].date).toBe('2024-05-01');

      // id 검증
      const ids = result.map((event) => event.id);
      expect(new Set(ids).size).toBe(3); // 모든 id가 고유한지 확인
    });

    it('매년 반복 일정이 올바르게 생성되어야 한다', () => {
      const event = {
        ...baseEvent,
        repeat: {
          type: 'yearly' as RepeatType,
          interval: 1,
          endDate: '2026-03-01',
        },
      };

      const result = makeRepeatEventList(event);
      expect(result).toHaveLength(3); // 2024/3/1, 2025/3/1, 2026/3/1

      // 날짜 검증
      expect(result[0].date).toBe('2024-03-01');
      expect(result[1].date).toBe('2025-03-01');
      expect(result[2].date).toBe('2026-03-01');

      // id 검증
      const ids = result.map((event) => event.id);
      expect(new Set(ids).size).toBe(3); // 모든 id가 고유한지 확인
    });
  });

  describe('반복 간격 설정', () => {
    it('2일 간격의 일일 반복 일정이 올바르게 생성되어야 한다', () => {
      const event = {
        ...baseEvent,
        repeat: {
          type: 'daily' as RepeatType,
          interval: 2,
          endDate: '2024-03-05',
        },
      };

      const result = makeRepeatEventList(event);
      expect(result).toHaveLength(3); // 3/1, 3/3, 3/5

      // 날짜 검증
      expect(result[0].date).toBe('2024-03-01');
      expect(result[1].date).toBe('2024-03-03');
      expect(result[2].date).toBe('2024-03-05');

      // id 검증
      const ids = result.map((event) => event.id);
      expect(new Set(ids).size).toBe(3); // 모든 id가 고유한지 확인
    });

    it('2주 간격의 주간 반복 일정이 올바르게 생성되어야 한다', () => {
      const event = {
        ...baseEvent,
        repeat: {
          type: 'weekly' as RepeatType,
          interval: 2,
          endDate: '2024-03-29',
        },
      };

      const result = makeRepeatEventList(event);
      expect(result).toHaveLength(3); // 3/1, 3/15, 3/29

      // 날짜 검증
      expect(result[0].date).toBe('2024-03-01');
      expect(result[1].date).toBe('2024-03-15');
      expect(result[2].date).toBe('2024-03-29');

      // id 검증
      const ids = result.map((event) => event.id);
      expect(new Set(ids).size).toBe(3); // 모든 id가 고유한지 확인
    });
  });

  describe('반복 종료', () => {
    it('종료일이 시작일보다 이전인 경우 빈 배열을 반환해야 한다', () => {
      const event = {
        ...baseEvent,
        repeat: {
          type: 'daily' as RepeatType,
          interval: 1,
          endDate: '2024-02-29',
        },
      };

      const result = makeRepeatEventList(event);
      expect(result).toHaveLength(0);
    });

    it('반복이 아닌 일정의 경우 원본 일정만 반환해야 한다', () => {
      const event = {
        ...baseEvent,
        repeat: {
          type: 'none' as RepeatType,
          interval: 1,
        },
      };

      const result = makeRepeatEventList(event);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(event);
    });
  });
});
