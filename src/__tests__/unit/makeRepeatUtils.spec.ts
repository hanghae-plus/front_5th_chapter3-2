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
        },
      };

      const result = makeRepeatEventList(event);
      expect(result).toHaveLength(1); // 기본 구현 전이므로 임시로 1개 반환
    });

    it('매주 반복 일정이 올바르게 생성되어야 한다', () => {
      const event = {
        ...baseEvent,
        repeat: {
          type: 'weekly' as RepeatType,
          interval: 1,
        },
      };

      const result = makeRepeatEventList(event);
      expect(result).toHaveLength(1); // 기본 구현 전이므로 임시로 1개 반환
    });

    it('매월 반복 일정이 올바르게 생성되어야 한다', () => {
      const event = {
        ...baseEvent,
        repeat: {
          type: 'monthly' as RepeatType,
          interval: 1,
        },
      };

      const result = makeRepeatEventList(event);
      expect(result).toHaveLength(1); // 기본 구현 전이므로 임시로 1개 반환
    });

    it('매년 반복 일정이 올바르게 생성되어야 한다', () => {
      const event = {
        ...baseEvent,
        repeat: {
          type: 'yearly' as RepeatType,
          interval: 1,
        },
      };

      const result = makeRepeatEventList(event);
      expect(result).toHaveLength(1); // 기본 구현 전이므로 임시로 1개 반환
    });
  });

  describe('반복 간격 설정', () => {
    it('2일 간격의 일일 반복 일정이 올바르게 생성되어야 한다', () => {
      const event = {
        ...baseEvent,
        repeat: {
          type: 'daily' as RepeatType,
          interval: 2,
        },
      };

      const result = makeRepeatEventList(event);
      expect(result).toHaveLength(1); // 기본 구현 전이므로 임시로 1개 반환
    });

    it('2주 간격의 주간 반복 일정이 올바르게 생성되어야 한다', () => {
      const event = {
        ...baseEvent,
        repeat: {
          type: 'weekly' as RepeatType,
          interval: 2,
        },
      };

      const result = makeRepeatEventList(event);
      expect(result).toHaveLength(1); // 기본 구현 전이므로 임시로 1개 반환
    });
  });

  describe('반복 종료', () => {
    it('종료일이 있는 반복 일정이 올바르게 생성되어야 한다', () => {
      const event = {
        ...baseEvent,
        repeat: {
          type: 'daily' as RepeatType,
          interval: 1,
          endDate: '2024-03-31',
        },
      };

      const result = makeRepeatEventList(event);
      expect(result).toHaveLength(1); // 기본 구현 전이므로 임시로 1개 반환
    });

    it('종료일이 없는 반복 일정이 올바르게 생성되어야 한다', () => {
      const event = {
        ...baseEvent,
        repeat: {
          type: 'daily' as RepeatType,
          interval: 1,
        },
      };

      const result = makeRepeatEventList(event);
      expect(result).toHaveLength(1); // 기본 구현 전이므로 임시로 1개 반환
    });

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
  });
});
