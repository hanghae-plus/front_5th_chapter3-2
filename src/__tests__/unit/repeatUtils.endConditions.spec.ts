import { Event, RepeatInfo } from '../../types';
import { generateRepeatingEvents } from '../../utils/repeatUtils';

describe('반복 종료 조건', () => {
  const baseEventData: Omit<Event, 'id' | 'repeat'> = {
    title: '테스트 이벤트',
    date: '2025-05-01',
    startTime: '10:00',
    endTime: '11:00',
    description: '설명',
    location: '장소',
    category: '업무',
    notificationTime: 10,
  };
  const mockRepeatGroupId = 'test-group-1';

  it('maxOccurrences가 설정되면 지정된 횟수만큼 이벤트를 생성한다', () => {
    const repeatInfo: RepeatInfo = {
      type: 'daily',
      interval: 1,
      endDate: '2025-09-30', // 안전장치로 기본 종료일도 함께 설정
      maxOccurrences: 5, // 5회 반복
    };

    const events = generateRepeatingEvents(baseEventData, repeatInfo, mockRepeatGroupId);

    expect(events).toHaveLength(5);
    expect(events[0].date).toBe('2025-05-01');
    expect(events[4].date).toBe('2025-05-05');
  });

  it('endDate와 maxOccurrences가 모두 설정되면 먼저 도달하는 조건을 기준으로 이벤트를 생성한다', () => {
    // 종료일이 먼저인 경우
    const endDateFirstRepeatInfo: RepeatInfo = {
      type: 'daily',
      interval: 1,
      endDate: '2025-05-03',
      maxOccurrences: 10, // 10회 반복 (하지만 종료일이 먼저)
    };

    const endDateFirstEvents = generateRepeatingEvents(
      baseEventData,
      endDateFirstRepeatInfo,
      mockRepeatGroupId
    );

    expect(endDateFirstEvents).toHaveLength(3); // 종료일 기준 3개만 생성
    expect(endDateFirstEvents[2].date).toBe('2025-05-03');

    // 횟수가 먼저인 경우
    const maxOccurrencesFirstRepeatInfo: RepeatInfo = {
      type: 'daily',
      interval: 1,
      endDate: '2025-05-10',
      maxOccurrences: 3, // 3회 반복 (횟수 제한이 먼저)
    };

    const maxOccurrencesFirstEvents = generateRepeatingEvents(
      baseEventData,
      maxOccurrencesFirstRepeatInfo,
      mockRepeatGroupId
    );

    expect(maxOccurrencesFirstEvents).toHaveLength(3); // 횟수 기준 3개만 생성
    expect(maxOccurrencesFirstEvents[2].date).toBe('2025-05-03');
  });

  it('종료일(endDate)이 설정된 RepeatInfo를 전달받아 해당 종료일까지 이벤트를 생성한다', () => {
    const repeatInfo: RepeatInfo = {
      type: 'daily',
      interval: 1,
      endDate: '2025-09-30', // 종료일만 설정
    };

    const events = generateRepeatingEvents(baseEventData, repeatInfo, mockRepeatGroupId);

    // 2025-05-01부터 2025-09-30까지의 이벤트 수 계산
    const startDate = new Date('2025-05-01');
    const endDate = new Date('2025-09-30');
    const dayDiff =
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    expect(events.length).toBe(dayDiff);
    expect(events[0].date).toBe('2025-05-01');
    expect(events[events.length - 1].date).toBe('2025-09-30');
  });

  it('endDate가 없으면 이벤트를 생성하지 않는다', () => {
    const repeatInfo: RepeatInfo = {
      type: 'daily',
      interval: 1,
      // endDate 없음
    };

    const events = generateRepeatingEvents(baseEventData, repeatInfo, mockRepeatGroupId);

    expect(events).toHaveLength(0);
  });

  it('maxOccurrences가 기본 제한보다 큰 경우에도 정확히 maxOccurrences 횟수만큼 생성한다', () => {
    const largeOccurrenceRepeatInfo: RepeatInfo = {
      type: 'daily',
      interval: 1,
      endDate: '2026-12-31', // 먼 미래 날짜
      maxOccurrences: 50, // 50회 반복
    };

    const events = generateRepeatingEvents(
      baseEventData,
      largeOccurrenceRepeatInfo,
      mockRepeatGroupId
    );

    expect(events.length).toBe(50);
    expect(events[49].date).toBe('2025-06-19'); // 2025-05-01 + 49일
  });
});
