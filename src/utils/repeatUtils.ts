import { addDays, addMonths, addWeeks, addYears, isBefore, lastDayOfMonth } from 'date-fns';

import { EventForm } from '../types';

export const generateRepeatedEvents = (base: EventForm): EventForm[] => {
  const { repeat } = base;

  if (repeat.type === 'none') return [base];

  const events: EventForm[] = [];
  let currentDate = new Date(base.date);
  const endDate = repeat.endDate ? new Date(repeat.endDate) : new Date('2025-09-30');
  const originalDay = currentDate.getDate();
  let count = 0;

  while (
    (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) &&
    (!repeat.count || count < repeat.count)
  ) {
    events.push({
      ...base,
      date: currentDate.toISOString().slice(0, 10),
    });
    count++;

    switch (repeat.type) {
      case 'daily':
        currentDate = addDays(currentDate, repeat.interval);
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, repeat.interval);
        break;
      case 'monthly': {
        const next = addMonths(currentDate, repeat.interval);
        const endOfMonth = lastDayOfMonth(next).getDate();
        next.setDate(Math.min(originalDay, endOfMonth));
        currentDate = next;
        break;
      }
      case 'yearly': {
        const next = addYears(currentDate, repeat.interval);
        if (
          currentDate.getMonth() === 1 &&
          currentDate.getDate() === 29 &&
          next.getMonth() === 1 &&
          next.getDate() !== 29
        ) {
          next.setDate(28);
        }
        currentDate = next;
        break;
      }
    }
  }

  return events;
};
