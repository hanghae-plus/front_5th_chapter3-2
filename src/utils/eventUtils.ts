import { Event, EventForm } from '../types';
import { addDays, addWeeks, addMonths, addYears, getDaysInMonth, format } from 'date-fns';
import { getWeekDates, isDateInRange } from './dateUtils';

function filterEventsByDateRange(events: Event[], start: Date, end: Date): Event[] {
  return events.filter((event) => {
    const eventDate = new Date(event.date);
    return isDateInRange(eventDate, start, end);
  });
}

function containsTerm(target: string, term: string) {
  return target.toLowerCase().includes(term.toLowerCase());
}

function searchEvents(events: Event[], term: string) {
  return events.filter(
    ({ title, description, location }) =>
      containsTerm(title, term) || containsTerm(description, term) || containsTerm(location, term)
  );
}

function filterEventsByDateRangeAtWeek(events: Event[], currentDate: Date) {
  const weekDates = getWeekDates(currentDate);
  return filterEventsByDateRange(events, weekDates[0], weekDates[6]);
}

function filterEventsByDateRangeAtMonth(events: Event[], currentDate: Date) {
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  return filterEventsByDateRange(events, monthStart, monthEnd);
}

export function getFilteredEvents(
  events: Event[],
  searchTerm: string,
  currentDate: Date,
  view: 'week' | 'month'
): Event[] {
  const searchedEvents = searchEvents(events, searchTerm);

  if (view === 'week') {
    return filterEventsByDateRangeAtWeek(searchedEvents, currentDate);
  }

  if (view === 'month') {
    return filterEventsByDateRangeAtMonth(searchedEvents, currentDate);
  }

  return searchedEvents;
}

export const isLeapYear = (year: number) => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

export const generateRepeatEvents = (event: Event | EventForm): Event[] => {
  const { repeat, date } = event;
  const { type, interval, endDate } = repeat;

  const initialDate = new Date(date);
  const repeatEndDate = endDate ? new Date(endDate) : new Date('2025-09-30');
  const repeatEvents: Event[] = [];

  let currentDate = new Date(initialDate);
  const originalDay = currentDate.getDate();

  while (currentDate <= repeatEndDate) {
    repeatEvents.push({
      ...(event as Event),
      date: format(currentDate, 'yyyy-MM-dd'),
    });

    switch (type) {
      case 'daily': {
        currentDate = addDays(currentDate, interval);
        break;
      }

      case 'weekly': {
        currentDate = addWeeks(currentDate, interval);
        break;
      }

      case 'monthly': {
        const nextDate = addMonths(currentDate, interval);
        const daysInTargetMonth = getDaysInMonth(nextDate);
        const adjustedDay = Math.min(originalDay, daysInTargetMonth);
        currentDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), adjustedDay);
        break;
      }

      case 'yearly': {
        const nextDate = addYears(currentDate, interval);
        const month = initialDate.getMonth();
        const isFeb = month === 1;
        const targetDay = isFeb
          ? isLeapYear(nextDate.getFullYear())
            ? 29
            : 28
          : Math.min(originalDay, getDaysInMonth(new Date(nextDate.getFullYear(), month)));

        currentDate = new Date(nextDate.getFullYear(), month, targetDay);
        break;
      }

      default:
        return repeatEvents;
    }
  }

  return repeatEvents;
};
