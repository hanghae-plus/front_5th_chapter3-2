import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Event, EventForm, RepeatInfo } from '../../types.ts';
import {
  generateRepeatEvents,
  isRepeatEvent,
  addRepeatTitle,
  convertToSingleEvent,
  isGeneratedRepeatEvent,
  RepeatEventOptions,
} from '../../utils/repeatUtils.ts';

describe('repeatUtils', () => {
  let baseEvent: EventForm;
  let baseEventWithId: Event;

  beforeEach(() => {
    baseEvent = {
      title: '테스트 회의',
      date: '2025-05-23',
      startTime: '10:00',
      endTime: '11:00',
      description: '테스트 설명',
      location: '회의실 A',
      category: '업무',
      repeat: {
        type: 'none',
        interval: 1,
      },
      notificationTime: 10,
    };

    baseEventWithId = {
      ...baseEvent,
      id: 'test-id-123',
    };

    // Date.now() 모킹
    vi.spyOn(Date, 'now').mockReturnValue(1620000000000);
  });

  describe('isRepeatEvent', () => {
    it('반복 설정이 none이면 false를 반환한다', () => {
      const event = { ...baseEvent, repeat: { type: 'none', interval: 1 } };
      expect(isRepeatEvent(event)).toBe(false);
    });

    it('반복 설정이 daily면 true를 반환한다', () => {
      const event = { ...baseEvent, repeat: { type: 'daily', interval: 1 } };
      expect(isRepeatEvent(event)).toBe(true);
    });

    it('반복 설정이 weekly면 true를 반환한다', () => {
      const event = { ...baseEvent, repeat: { type: 'weekly', interval: 1 } };
      expect(isRepeatEvent(event)).toBe(true);
    });

    it('반복 설정이 monthly면 true를 반환한다', () => {
      const event = { ...baseEvent, repeat: { type: 'monthly', interval: 1 } };
      expect(isRepeatEvent(event)).toBe(true);
    });

    it('반복 설정이 yearly면 true를 반환한다', () => {
      const event = { ...baseEvent, repeat: { type: 'yearly', interval: 1 } };
      expect(isRepeatEvent(event)).toBe(true);
    });
  });

  describe('addRepeatTitle', () => {
    it('반복 일정인 경우에 제목에 (반복) 접두사가 추가된다', () => {
      const event = { ...baseEvent, title: '일반 회의' };
      const result = addRepeatTitle(event);
      expect(result.title).toBe('(반복) 일반 회의');
    });

    it('제목에 이미 (반복) 접두사가 있으면 추가하지 않는다', () => {
      const event = { ...baseEvent, title: '(반복) 이미 반복 회의' };
      const result = addRepeatTitle(event);
      expect(result.title).toBe('(반복) 이미 반복 회의');
    });
  });

  describe('convertToSingleEvent', () => {
    it('반복 설정을 none으로 변경한다', () => {
      const event = {
        ...baseEvent,
        repeat: { type: 'daily', interval: 2 } as RepeatInfo,
      };
      const result = convertToSingleEvent(event);
      expect(result.repeat.type).toBe('none');
      expect(result.repeat.interval).toBe(1);
    });

    it('제목에서 (반복) 접두사를 제거한다', () => {
      const event = { ...baseEvent, title: '(반복) 반복 회의' };
      const result = convertToSingleEvent(event);
      expect(result.title).not.toContain('(반복)');
    });

    it('기존 일정의 정보들은 변경되지 않는다', () => {
      const event = {
        ...baseEvent,
        title: '(반복) 원본 회의',
        repeat: { type: 'daily', interval: 1 } as RepeatInfo,
      };
      const result = convertToSingleEvent(event);
      expect(event.repeat.type).toBe('daily');
      expect(event.title).toBe('(반복) 원본 회의');
    });
  });

  describe('isGeneratedRepeatEvent', () => {
    it('ID에 _repeat_가 포함되면 true를 반환한다', () => {
      const event = { ...baseEventWithId, id: 'test_repeat_1' };
      expect(isGeneratedRepeatEvent(event)).toBe(true);
    });

    it('ID가 repeat_로 시작하면 true를 반환한다', () => {
      const event = { ...baseEventWithId, id: 'repeat_1620000000000_1' };
      expect(isGeneratedRepeatEvent(event)).toBe(true);
    });

    it('일반 ID면 false를 반환한다', () => {
      const event = { ...baseEventWithId, id: 'normal-id-123' };
      expect(isGeneratedRepeatEvent(event)).toBe(false);
    });

    it('ID가 없으면 false를 반환한다', () => {
      const event = baseEvent as any;
      expect(isGeneratedRepeatEvent(event)).toBe(false);
    });
  });

  describe('generateRepeatEvents', () => {
    it('반복 설정이 none이면 원본 이벤트만 반환한다', () => {
      const event = { ...baseEvent, repeat: { type: 'none', interval: 1 } };
      const result = generateRepeatEvents(event);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(event);
    });

    describe('일간 반복', () => {
      it('매일 반복하는 이벤트를 생성한다', () => {
        const event = {
          ...baseEvent,
          date: '2025-05-23',
          repeat: { type: 'daily', interval: 1, endDate: '2025-05-25' } as RepeatInfo,
        };
        const result = generateRepeatEvents(event);

        expect(result).toHaveLength(3);
        expect(result[0].date).toBe('2025-05-23');
        expect(result[1].date).toBe('2025-05-24');
        expect(result[2].date).toBe('2025-05-25');
      });

      it('2일마다 반복하는 이벤트를 생성한다', () => {
        const event = {
          ...baseEvent,
          date: '2025-05-23',
          repeat: { type: 'daily', interval: 2, endDate: '2025-05-27' } as RepeatInfo,
        };
        const result = generateRepeatEvents(event);

        expect(result).toHaveLength(3);
        expect(result[0].date).toBe('2025-05-23');
        expect(result[1].date).toBe('2025-05-25');
        expect(result[2].date).toBe('2025-05-27');
      });
    });

    describe('주간 반복', () => {
      it('매주 반복하는 이벤트를 생성한다', () => {
        const event = {
          ...baseEvent,
          date: '2025-05-23', // 금요일
          repeat: { type: 'weekly', interval: 1, endDate: '2025-06-06' } as RepeatInfo,
        };
        const result = generateRepeatEvents(event);

        expect(result).toHaveLength(3);
        expect(result[0].date).toBe('2025-05-23');
        expect(result[1].date).toBe('2025-05-30');
        expect(result[2].date).toBe('2025-06-06');
      });

      it('2주마다 반복하는 이벤트를 생성한다', () => {
        const event = {
          ...baseEvent,
          date: '2025-05-23',
          repeat: { type: 'weekly', interval: 2, endDate: '2025-06-20' } as RepeatInfo,
        };
        const result = generateRepeatEvents(event);

        expect(result).toHaveLength(3);
        expect(result[0].date).toBe('2025-05-23');
        expect(result[1].date).toBe('2025-06-06');
        expect(result[2].date).toBe('2025-06-20');
      });
    });

    describe('월간 반복', () => {
      it('매월 반복하는 이벤트를 생성한다', () => {
        const event = {
          ...baseEvent,
          date: '2025-01-15',
          repeat: { type: 'monthly', interval: 1, endDate: '2025-03-15' } as RepeatInfo,
        };
        const result = generateRepeatEvents(event);

        expect(result).toHaveLength(3);
        expect(result[0].date).toBe('2025-01-15');
        expect(result[1].date).toBe('2025-02-15');
        expect(result[2].date).toBe('2025-03-15');
      });

      it('31일 매월 반복 시 월말 조정을 한다', () => {
        const event = {
          ...baseEvent,
          date: '2025-01-30',
          repeat: { type: 'monthly', interval: 1, endDate: '2025-03-30' } as RepeatInfo,
        };
        const result = generateRepeatEvents(event);

        console.log('result:', result);
        expect(result).toHaveLength(3);
        expect(result[0].date).toBe('2025-01-30');
        expect(result[1].date).toBe('2025-02-28'); // 2월은 28일로 조정
        expect(result[2].date).toBe('2025-03-30');
      });
    });

    describe('연간 반복', () => {
      it('매년 반복하는 이벤트를 생성한다', () => {
        const event = {
          ...baseEvent,
          date: '2025-05-23',
          repeat: { type: 'yearly', interval: 1, endDate: '2027-05-23' } as RepeatInfo,
        };
        const result = generateRepeatEvents(event);

        expect(result).toHaveLength(3);
        expect(result[0].date).toBe('2025-05-23');
        expect(result[1].date).toBe('2026-05-23');
        expect(result[2].date).toBe('2027-05-23');
      });

      it('윤년 2월 29일 매년 반복 시 평년에는 28일로 조정한다', () => {
        const event = {
          ...baseEvent,
          date: '2024-02-29', // 윤년
          repeat: { type: 'yearly', interval: 1, endDate: '2026-02-28' } as RepeatInfo,
        };
        const result = generateRepeatEvents(event);
        console.log('result:', result);

        expect(result).toHaveLength(3);
        expect(result[0].date).toBe('2024-02-29'); // 윤년
        expect(result[1].date).toBe('2025-02-28'); // 평년 조정
        expect(result[2].date).toBe('2026-02-28'); // 평년 조정
      });
    });

    describe('ID 생성', () => {
      it('EventForm 타입의 경우 repeat_ 접두사가 있는 ID를 생성한다', () => {
        const event = {
          ...baseEvent,
          repeat: { type: 'daily', interval: 1, endDate: '2025-05-24' } as RepeatInfo,
        };
        const result = generateRepeatEvents(event);

        expect(result).toHaveLength(2);
        expect((result[0] as any).id).toBe('repeat_1620000000000_1');
      });

      it('Event 타입의 경우 기존 ID에 _repeat_를 추가한다', () => {
        const event = {
          ...baseEventWithId,
          repeat: { type: 'daily', interval: 1, endDate: '2025-05-24' } as RepeatInfo,
        };
        const result = generateRepeatEvents(event);

        expect(result).toHaveLength(2);
        expect((result[0] as Event).id).toBe('test-id-123_repeat_1');
      });
    });

    describe('옵션 설정', () => {
      it('maxEvents 옵션으로 최대 생성 개수를 제한한다', () => {
        const event = {
          ...baseEvent,
          date: '2025-05-23',
          repeat: { type: 'daily', interval: 1 } as RepeatInfo,
        };
        const options: RepeatEventOptions = { maxEvents: 5 };
        const result = generateRepeatEvents(event, options);

        expect(result).toHaveLength(5);
      });

      it('maxEndDate 옵션으로 최대 종료일을 설정한다', () => {
        const event = {
          ...baseEvent,
          date: '2025-05-23',
          repeat: { type: 'daily', interval: 1 } as RepeatInfo,
        };
        const options: RepeatEventOptions = { maxEndDate: '2025-05-25' };
        const result = generateRepeatEvents(event, options);

        expect(result).toHaveLength(3);
        expect(result[0].date).toBe('2025-05-23');
        expect(result[1].date).toBe('2025-05-24');
        expect(result[2].date).toBe('2025-05-25');
      });
    });

    describe('원본 이벤트가 변경이 안되어야 한다', () => {
      it('원본 이벤트는 변경되지 않는다', () => {
        const event = {
          ...baseEvent,
          date: '2025-05-23',
          repeat: { type: 'daily', interval: 1, endDate: '2025-05-24' } as RepeatInfo,
        };
        const originalEvent = { ...event };

        generateRepeatEvents(event);

        expect(event).toEqual(originalEvent);
      });
    });
  });
});
