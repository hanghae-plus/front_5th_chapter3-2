import { addDays, addWeeks, addMonths, addYears, format, isLeapYear } from 'date-fns';

import { EventForm, Event } from '../types';
import { getNextLeapYear } from './dateUtils';
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
        {
          const month = currentDate.getMonth();
          const day = currentDate.getDate();

          if (month === 1 && day === 29 && isLeapYear(currentDate)) {
            const nextLeapYear = getNextLeapYear(currentDate, repeatEndDate);
            currentDate = new Date(nextLeapYear, month, day);
          } else {
            currentDate = addYears(currentDate, interval);
          }
        }
        break;
      default:
        return repeatEvents;
    }
  }

  return repeatEvents;
};
