/* eslint-disable no-case-declarations */
import { Event } from '@/types';

export function generateRecurringEvents(event: Event, maxOccurrences?: number): Event[] {
  if (!event.repeat || !event.repeat.type || !event.repeat.interval) {
    return [event];
  }

  const { type, interval, endDate } = event.repeat;
  const startDate = new Date(event.date);

  if (!endDate) {
    throw new Error('반복 설정에는 종료 날짜가 필요합니다.');
  }

  const endDateObj = new Date(endDate);

  if (endDateObj < startDate) {
    throw new Error('종료 날짜는 시작 날짜보다 이후여야 합니다.');
  }

  const events: Event[] = [];
  let currentDate = new Date(startDate);
  let count = 0;

  while (currentDate <= endDateObj && (maxOccurrences === undefined || count < maxOccurrences)) {
    const newEvent: Event = {
      ...JSON.parse(JSON.stringify(event)),
      date: formatDate(currentDate),
      id: `${event.id}_${count}`,
    };

    events.push(newEvent);
    count++;

    currentDate = getNextDate(currentDate, type, interval);
  }

  return events;
}

const getNextDate = (date: Date, type: string, interval: number): Date => {
  const newDate = new Date(date);
  const isLastDayOfMonth = () => {
    const lastDay = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
    return newDate.getDate() === lastDay;
  };
  const wasLastDayOfMonth = isLastDayOfMonth();
  switch (type) {
    case 'daily':
      newDate.setDate(newDate.getDate() + interval);
      break;
    case 'weekly':
      newDate.setDate(newDate.getDate() + interval * 7);
      break;
    case 'monthly':
      const initialDay = newDate.getDate();

      if (wasLastDayOfMonth) {
        newDate.setMonth(newDate.getMonth() + interval + 1, 0);
      } else {
        newDate.setMonth(newDate.getMonth() + interval);

        if (newDate.getDate() !== initialDay) {
          newDate.setDate(0);
        }
      }
      break;
    case 'yearly':
      newDate.setFullYear(newDate.getFullYear() + interval);
      break;
    default:
      throw new Error(`Unknown repeat type: ${type}`);
  }

  return newDate;
};

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
