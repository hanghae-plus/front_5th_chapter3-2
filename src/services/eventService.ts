import { createEventsList } from '../apis/eventApi';
import { Event, EventForm, RepeatType } from '../types';
import { calculateNextRepeatDate } from '../utils/assigmentUtil';

export function generateRepeatingEvents(baseEvent: Event | EventForm): (Event | EventForm)[] {
  const events: (Event | EventForm)[] = [];
  const startDate = new Date(baseEvent.date);
  const endDate = baseEvent.repeat.endDate ? new Date(baseEvent.repeat.endDate) : null;

  let occurrenceCount = 0;

  // 종료일이 있거나 100회 이내로 제한 (무한 루프 방지)
  while (
    (endDate === null ||
      calculateNextRepeatDate(
        startDate,
        baseEvent.repeat.type as RepeatType,
        occurrenceCount * baseEvent.repeat.interval
      ) <= endDate) &&
    occurrenceCount < 100
  ) {
    // 현재 반복 일정의 날짜 계산
    const currentDate = calculateNextRepeatDate(
      startDate,
      baseEvent.repeat.type as RepeatType,
      occurrenceCount * baseEvent.repeat.interval
    );

    // 종료일을 초과하면 중단
    if (endDate && currentDate > endDate) break;

    // 포맷된 날짜 문자열
    const formattedDate = currentDate.toISOString().split('T')[0];

    // 새 일정 생성 (ID는 API에서 생성)
    if ('id' in baseEvent) {
      events.push({
        ...baseEvent,
        date: formattedDate,
        id: baseEvent.id,
      });
    } else {
      events.push({
        ...baseEvent,
        date: formattedDate,
      });
    }

    occurrenceCount++;
  }

  return events;
}

export async function saveRepeatingEvent(baseEvent: Event | EventForm): Promise<Event[]> {
  // 반복 일정 생성
  const events = generateRepeatingEvents(baseEvent);

  // API를 통해 이벤트 리스트 저장
  return await createEventsList({ events });
}
