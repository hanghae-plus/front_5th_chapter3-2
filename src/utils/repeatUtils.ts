import {
  parseISO,
  format,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isAfter,
  lastDayOfMonth,
  isLeapYear,
} from 'date-fns';

import type { EventForm, Event } from '../types';

const DEFAULT_END_DATE = '2025-09-30';

export function generateRepeatEvents(event: Event | EventForm): Event[] {
  const { repeat, date } = event;
  if (repeat.type === 'none') return [event as Event];

  const startDate = parseISO(date);
  const endDate = parseISO(repeat.endDate ?? DEFAULT_END_DATE);
  const interval = repeat.interval || 1;

  const baseDay = startDate.getDate();
  let current = new Date(startDate);

  const results: Event[] = [];

  while (!isAfter(current, endDate)) {
    const year = current.getFullYear();
    const month = current.getMonth();

    let newDate: Date;

    if (repeat.type === 'monthly') {
      const last = lastDayOfMonth(new Date(year, month)).getDate();
      const correctedDay = Math.min(baseDay, last);
      newDate = new Date(year, month, correctedDay);
    } else if (repeat.type === 'yearly') {
      if (month === 1 && baseDay === 29 && !isLeapYear(current)) {
        newDate = new Date(year, month, 28);
      } else {
        const last = lastDayOfMonth(new Date(year, month)).getDate();
        const correctedDay = Math.min(baseDay, last);
        newDate = new Date(year, month, correctedDay);
      }
    } else {
      newDate = new Date(current);
    }

    results.push({
      ...(event as Event),
      date: format(newDate, 'yyyy-MM-dd'),
    });

    current = getNextDate(current, repeat.type, interval);
  }

  return results;
}

function getNextDate(date: Date, type: string, interval: number): Date {
  switch (type) {
    case 'daily':
      return addDays(date, interval);
    case 'weekly':
      return addWeeks(date, interval);
    case 'monthly':
      return addMonths(date, interval);
    case 'yearly':
      return addYears(date, interval);
    default:
      return date;
  }
}
