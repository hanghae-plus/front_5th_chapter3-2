import { EventForm } from '../types';
import { formatDate, isLeapYear } from './dateUtils';

export const createRepeatEvents = (eventData: EventForm) => {
  const repeatedEvents: EventForm[] = [];

  if (!eventData.repeat || eventData.repeat.type === 'none') {
    return [eventData];
  }

  const getAdjustRepeatDate = (date: Date): Date => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    let adjustedDate = new Date(date);

    if (month === 1 && day === 29 && !isLeapYear(year)) {
      adjustedDate.setDate(28);
    }

    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    if (day > lastDayOfMonth) {
      adjustedDate.setDate(lastDayOfMonth);
    }

    return adjustedDate;
  };

  const { type, interval, endDate } = eventData.repeat;
  const startDate = new Date(eventData.date);
  const repeatEndDate = endDate ? new Date(endDate) : new Date('2025-09-30');
  let currentDate = new Date(startDate);

  while (!repeatEndDate || currentDate <= repeatEndDate) {
    repeatedEvents.push({
      ...eventData,
      date: formatDate(currentDate),
    });

    switch (type) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7 * interval);
        break;
      case 'monthly':
        // eslint-disable-next-line no-case-declarations
        const originalDay = new Date(eventData.date).getDate();

        currentDate.setMonth(currentDate.getMonth() + interval, 1);

        // eslint-disable-next-line no-case-declarations
        const lastDayOfNewMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        ).getDate();

        currentDate.setDate(Math.min(originalDay, lastDayOfNewMonth));
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + interval);

        if (currentDate.getMonth() === 2 && currentDate.getDate() === 1) {
          currentDate.setDate(0);
        }

        if (
          currentDate.getMonth() === 1 &&
          currentDate.getDate() === 28 &&
          isLeapYear(currentDate.getFullYear())
        ) {
          currentDate.setDate(29);
        }
        currentDate = getAdjustRepeatDate(currentDate);
        break;
    }
    if (repeatEndDate && currentDate > repeatEndDate) {
      break;
    }
  }

  return repeatedEvents;
};
