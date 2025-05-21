import { Event, EventForm } from '../types';
import { formatDate } from './dateUtils';

function generateRepeatDates(event: Event | EventForm): string[] {
  const { repeat, date } = event;
  if (repeat.type === 'none') return [date];

  const startDate = new Date(date);
  const endDate = repeat.endDate ? new Date(repeat.endDate) : new Date('2025-09-30');
  const interval = repeat.interval || 1;

  const repeatDates: string[] = [];
  let currentDate = new Date(startDate);

  const isWithinEndDate = (date: Date): boolean => {
    if (!endDate) return true;
    return date <= endDate;
  };

  repeatDates.push(formatDate(currentDate));

  switch (repeat.type) {
    case 'daily':
      while (isWithinEndDate(currentDate)) {
        currentDate.setDate(currentDate.getDate() + interval);
        if (currentDate > endDate) break;
        repeatDates.push(formatDate(currentDate));
      }
      break;

    case 'weekly':
      while (isWithinEndDate(currentDate)) {
        currentDate.setDate(currentDate.getDate() + 7 * interval);
        if (currentDate > endDate) break;
        repeatDates.push(formatDate(currentDate));
      }
      break;

    case 'monthly':
      while (isWithinEndDate(currentDate)) {
        const currentDay = currentDate.getDate();

        currentDate.setMonth(currentDate.getMonth() + interval);

        const maxDaysInMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        ).getDate();

        if (currentDay > maxDaysInMonth) {
          currentDate.setDate(maxDaysInMonth);
        } else {
          currentDate.setDate(currentDay);
        }

        if (!isWithinEndDate(currentDate)) break;
        if (currentDate > endDate) break;
        repeatDates.push(formatDate(currentDate));
      }
      break;

    case 'yearly':
      while (isWithinEndDate(currentDate)) {
        const currentDay = currentDate.getDate();
        const currentMonth = currentDate.getMonth();

        currentDate.setFullYear(currentDate.getFullYear() + interval);
        currentDate.setMonth(currentMonth);
        const maxDaysInMonth = new Date(currentDate.getFullYear(), currentMonth + 1, 0).getDate();

        if (currentDay > maxDaysInMonth) {
          currentDate.setDate(maxDaysInMonth);
        } else {
          currentDate.setDate(currentDay);
        }

        if (!isWithinEndDate(currentDate)) break;
        if (currentDate > endDate) break;
        repeatDates.push(formatDate(currentDate));
      }
      break;
  }

  return repeatDates;
}

export { generateRepeatDates };
