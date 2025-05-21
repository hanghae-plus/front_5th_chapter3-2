import { Event, EventForm } from '../types';
import { getDaysInMonth } from './dateUtils';

export function generateRecurringEvents(event: Event): EventForm[] {
  console.log('generateRecurringEvents', event);
  const { repeat, ...baseEvent } = event;
  if (repeat.type === 'none') return [event];

  const recurringEvents: EventForm[] = [];
  let currentDate = new Date(event.date);

  const endDate = repeat.endDate ? new Date(repeat.endDate) : null;

  while (!endDate || currentDate <= endDate) {
    recurringEvents.push({
      ...baseEvent,
      date: currentDate.toISOString().split('T')[0],
      repeat: repeat,
    });

    const nextDate = new Date(currentDate);

    if (repeat.type === 'daily') {
      nextDate.setDate(currentDate.getDate() + repeat.interval);
    } else if (repeat.type === 'weekly') {
      nextDate.setDate(currentDate.getDate() + repeat.interval * 7);
    } else if (repeat.type === 'monthly') {
      const originalDay = currentDate.getDate();
      nextDate.setMonth(currentDate.getMonth() + repeat.interval);

      const lastDayOfMonth = getDaysInMonth(nextDate.getFullYear(), nextDate.getMonth() + 1);

      if (originalDay > lastDayOfMonth) {
        nextDate.setDate(lastDayOfMonth);
      } else {
        nextDate.setDate(originalDay);
      }
    } else if (repeat.type === 'yearly') {
      const nextYear = currentDate.getFullYear() + repeat.interval;
      if (endDate && nextYear > endDate.getFullYear()) break;
      nextDate.setFullYear(nextYear);

      const isLeapYear = (nextYear % 4 === 0 && nextYear % 100 !== 0) || nextYear % 400 === 0;
      if (!isLeapYear && nextDate.getMonth() === 1 && nextDate.getDate() === 29) {
        nextDate.setDate(28);
      }
    }

    currentDate = nextDate;
  }

  console.log('recurringEvents', recurringEvents);
  return recurringEvents;
}
