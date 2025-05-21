import { Event } from '../types';
import { formatDate, getNextRepeatDate } from './dateUtils';

export const createRepeatEvents = (event: Event): Event[] => {
  const { repeat } = event;
  if (!repeat || repeat.type === 'none') {
    return [];
  }

  const repeatEvents: Event[] = [];

  const startDate = new Date(event.date);
  const maxDate = new Date('2025-09-30'); // endDate가 주어지지 않았을 때 반복 이벤트의 최대 날짜 설정 (2025년 9월 30일)
  const endDate = repeat.endDate ? new Date(repeat.endDate) : maxDate;
  
  let currentDate = new Date(startDate);
  let eventIdCounter = 1;
  const repeatGroupId = `repeat-${event.id}`;
  
  while (currentDate <= endDate && currentDate <= maxDate) {
    const newEvent: Event = {
      ...event,
      id: `${eventIdCounter}`,
      date: formatDate(currentDate),
      repeat: {
        ...event.repeat,
        id: repeatGroupId,
      },
    }
    repeatEvents.push(newEvent);
    
    const nextDate = getNextRepeatDate(currentDate, repeat.type, repeat.interval || 1);
    if (!nextDate || nextDate > endDate || nextDate > maxDate) break;

    currentDate = nextDate;
    eventIdCounter++;
  }

  return repeatEvents;
}; 