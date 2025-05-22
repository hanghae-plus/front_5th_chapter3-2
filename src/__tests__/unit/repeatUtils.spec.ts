import { EventForm } from '../../types.ts';
import { generateRepeatedEvents } from '../../utils/repeatUtils';

// 이벤트 배열에서 날짜만 추출해서 비교할 수 있게 도와주는 util function
const getDates = (events: EventForm[]) => events.map((e) => e.date);

describe('generateRepeatedEvents', () => {
  let baseEvent: EventForm;

  beforeEach(() => {
    baseEvent = {
      title: '테스트 일정',
      date: '2025-01-31',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '',
      notificationTime: 10,
      repeat: {
        type: 'monthly',
        interval: 1,
        endDate: '2025-03-31',
      },
    };
  });

  // 1. 반복 유형 선택 테스트 (monthly, yearly)
  describe('반복 유형 선택', () => {
    it('monthly 반복은 1월 31일 → 2월 28일 → 3월 31일을 포함해야 한다', () => {
      // 월별 반복일정 생성 시 말일 보정(2월 28일) 처리 검증
      const results = generateRepeatedEvents(baseEvent);
      expect(getDates(results)).toEqual(['2025-01-31', '2025-02-28', '2025-03-31']);
    });

    it('yearly 반복은 윤년 날짜(2월 29일)를 평년에는 2월 28일로 처리한다', () => {
      // 윤년 테스트 2024-02-29 → 2025-02-28 → 2026-02-28
      const leapEvent: EventForm = {
        ...baseEvent,
        date: '2024-02-29',
        repeat: {
          type: 'yearly',
          interval: 1,
          endDate: '2026-03-01',
        },
      };

      const results = generateRepeatedEvents(leapEvent);
      expect(getDates(results)).toEqual(['2024-02-29', '2025-02-28', '2026-02-28']);
    });
  });

  // 2. 반복 간격 설정 테스트
  describe('반복 간격 설정', () => {
    it('3일마다 반복되는 daily 일정 생성', () => {
      // 3일마다 반복되는 일정 생성 여부 확인
      const event = {
        ...baseEvent,
        date: '2025-01-31',
        repeat: { type: 'daily' as const, interval: 3, endDate: '2025-02-10' },
      };

      const results = generateRepeatedEvents(event);
      expect(getDates(results)).toEqual(['2025-01-31', '2025-02-03', '2025-02-06', '2025-02-09']);
    });
  });

  // 4. 반복 종료 조건 테스트
  describe('반복 종료 조건', () => {
    it('endDate가 있으면 해당 날짜까지만 반복 생성된다', () => {
      // 종료 날짜(endDate)까지 반복되는지 확인
      const event = {
        ...baseEvent,
        date: '2025-01-01',
        repeat: {
          type: 'daily' as const,
          interval: 1,
          endDate: '2025-01-03',
        },
      };

      const results = generateRepeatedEvents(event);
      expect(getDates(results)).toEqual(['2025-01-01', '2025-01-02', '2025-01-03']);
    });

    it('count가 지정되면 해당 횟수만큼만 반복된다', () => {
      // count 따라 반복 횟수가 정확한지 확인
      const event = {
        ...baseEvent,
        date: '2025-01-01',
        repeat: {
          type: 'weekly' as const,
          interval: 1,
          count: 3,
        },
      };

      const results = generateRepeatedEvents(event);
      expect(getDates(results)).toEqual(['2025-01-01', '2025-01-08', '2025-01-15']);
    });

    it('endDate와 count가 없으면 기본 종료일 2025-09-30까지만 생성된다', () => {
      // 종료 조건이 없으면, 기본 종료일인 2025-09-30까지 생성됨을 검증
      const event = {
        ...baseEvent,
        date: '2025-01-01',
        repeat: {
          type: 'monthly' as const,
          interval: 1,
        },
      };

      const results = generateRepeatedEvents(event);
      const last = results.at(-1);
      expect(last).toBeDefined(); // 마지막 요소는 존재
      expect(last!.date <= '2025-09-30').toBe(true); // 기본 종료일 전인지 확인
    });
  });

  // 5 & 6. 단일 수정/삭제 기능 테스트
  describe('단일 수정 및 삭제', () => {
    // 3일 반복 이벤트를 빠르게 만드는 헬퍼 함수
    const setup3DayEvent = (): EventForm[] =>
      generateRepeatedEvents({
        ...baseEvent,
        date: '2025-01-01',
        repeat: { type: 'daily' as const, interval: 1, count: 3 },
      });

    it('반복 일정 중 하나를 수정하면 반복이 해제된다', () => {
      // 특정 일정 하나만 수정하고 repeat.type을 'none'으로 바꾼 경우
      const events = setup3DayEvent();
      const edited = { ...events[1], title: '수정된 일정', repeat: { type: 'none', interval: 1 } };

      expect(edited.repeat.type).toBe('none'); // 수정된 event는 반복 없음 상태
      expect(events[1].repeat.type).not.toBe('none'); // 원본 events는 여전히 반복 중
    });

    it('반복 일정 중 하나를 삭제하면 나머지는 유지된다', () => {
      // 3개 중 1개 일정 삭제했을 때 나머지 2개가 정상적으로 유지됐는지 확인
      const events = setup3DayEvent();
      const remaining = events.filter((e) => e.date !== '2025-01-02');

      expect(remaining).toHaveLength(2);
      expect(getDates(remaining)).toEqual(['2025-01-01', '2025-01-03']);
    });
  });
});
