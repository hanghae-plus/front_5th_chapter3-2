import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';

import { EventForm, Event } from '../types';

export const createRepeatEvents = (event: Event | EventForm) => {
  const { repeat, date } = event;
  const { type, interval, endDate } = repeat;

  const repeatEndDate = endDate ? new Date(endDate) : new Date('2025-09-30');
  let currentDate = new Date(date);
  const repeatEvents: Event[] = [];

  while (currentDate <= repeatEndDate) {
    repeatEvents.push({
      ...(event as Event),
      date: format(currentDate, 'yyyy-MM-dd'),
    });

    // 다음 발생일 계산
    switch (type) {
      case 'daily':
        currentDate = addDays(currentDate, interval);
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, interval);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, interval);
        break;
      case 'yearly':
        currentDate = addYears(currentDate, interval);
        break;
      default:
        return repeatEvents;
    }
  }

  return repeatEvents;
};
