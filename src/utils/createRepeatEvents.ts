import { Event, EventForm } from '../types';

const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

export const createRepeatEvents = (event: Event | EventForm) => {
  const { repeat, date } = event;
  const { type, interval, endDate } = repeat;

  const repeatEndDate = endDate ? new Date(endDate) : new Date('2025-09-30');
  let currentDate = new Date(date);

  const repeatEvents: Event[] = [];

  while (currentDate <= repeatEndDate) {
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const maxDaysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();

    repeatEvents.push({
      ...(event as Event),
      date: currentDate.toISOString().split('T')[0],
    });

    switch (type) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7 * interval);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + interval);

        if (currentDay >= maxDaysInMonth) {
          currentDate.setDate(maxDaysInMonth);
        } else {
          currentDate.setDate(currentDay);
        }
        break;
      case 'yearly': {
        const newYear = currentDate.getFullYear() + interval;

        if (currentMonth === 1) {
          const isNewLeapYear = isLeapYear(newYear);
          const adjustedDay = isNewLeapYear ? 29 : 28;
          currentDate = new Date(newYear, currentMonth, adjustedDay);
        } else {
          const maxDaysInNewYearMonth = new Date(newYear, currentMonth + 1, 0).getDate();
          const adjustedDay = Math.min(currentDay, maxDaysInNewYearMonth);
          currentDate = new Date(newYear, currentMonth, adjustedDay);
        }
        break;
      }
      default:
        return repeatEvents;
    }
  }

  return repeatEvents;
};
