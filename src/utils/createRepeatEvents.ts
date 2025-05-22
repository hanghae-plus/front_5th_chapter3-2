import { Event, RepeatInfo } from '../types';
import { formatDate, getNextRepeatDate } from './dateUtils';

const isDateLimitReached = (nextDate: Date | null, endDate: Date, maxDate: Date): boolean => {
  if (!nextDate) return true;
  return nextDate > endDate || nextDate > maxDate;
};

const isCountLimitReached = (repeat: RepeatInfo, repeatEventsLength: number): boolean => {
  if (repeat.endType !== 'count') return false;
  return repeatEventsLength >= (repeat.endCount || 1);
};

export const createRepeatEvents = (event: Event): Event[] => {
  const { repeat } = event;
  if (!repeat || repeat.type === 'none') {
    return [];
  }

  const repeatEvents: Event[] = [];

  const startDate = new Date(event.date);
  const maxDate = new Date('2025-09-30'); // endDate가 주어지지 않았을 때 반복 이벤트의 최대 날짜 설정 (2025년 9월 30일)
  const endDate = repeat.endType === 'date' && repeat.endDate ? new Date(repeat.endDate) : maxDate;

  let currentDate = new Date(startDate);
  let eventIdCounter = 1;
  const repeatGroupId = `repeat-${event.id}`;

  while (currentDate <= endDate && currentDate <= maxDate) {
    repeatEvents.push({
      ...event,
      id: `${eventIdCounter}`,
      date: formatDate(currentDate),
      repeat: {
        ...event.repeat,
        id: repeatGroupId,
      },
    });

    const nextDate = getNextRepeatDate(currentDate, repeat.type, repeat.interval || 1);
    if (
      isDateLimitReached(nextDate, endDate, maxDate) ||
      isCountLimitReached(repeat, repeatEvents.length)
    )
      break;

    currentDate = nextDate;
    eventIdCounter++;
  }

  return repeatEvents;
};
