import { Event, EventForm } from '../types';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';
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

export const createRepeatEvents = (event: Event | EventForm) => {
  const { repeat, date } = event;
  const { type, interval, endDate } = repeat;

  let currentDate = new Date(date);
  const repeatEndDate = endDate ? new Date(endDate) : new Date('2025-09-30');
  const repeatEvents: Event[] = [];

  while (currentDate <= repeatEndDate) {
    repeatEvents.push({
      ...(event as Event),
      date: format(currentDate, 'yyyy-MM-dd'),
    });

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
      case 'yearly': {
        const nextYear = currentDate.getFullYear() + interval;
        const nextMonth = currentDate.getMonth();
        const nextDay = currentDate.getDate();

        // 2월 29일인 경우 다음 해가 윤년이 아닐 때 2월 28일로 조정
        if (nextMonth === 1 && nextDay === 29) {
          if (!isLeapYear(nextYear)) {
            currentDate = new Date(nextYear, nextMonth, 28);
            break;
          }
        }

        currentDate = new Date(nextYear, nextMonth, nextDay);
        break;
      }
      default:
        return repeatEvents;
    }
  }

  return repeatEvents;
};
