import { Event, EventForm } from '../types';
import { addDays, addWeeks, format, getDaysInMonth } from 'date-fns';
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

export const generateRepeatEvents = (event: Event | EventForm) => {
  const { repeat, date } = event;
  const { type, interval, endDate } = repeat;

  let currentDate = new Date(date);
  // endDate가 없으면 2025-09-30으로 설정
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
      case 'monthly': {
        const nextMonth = currentDate.getMonth() + interval;
        const nextYear = currentDate.getFullYear() + Math.floor(nextMonth / 12);
        const adjustedMonth = nextMonth % 12;
        const currentDay = currentDate.getDate();

        // 말일(31일) 처리
        if (currentDay === 31) {
          const daysInNextMonth = getDaysInMonth(new Date(nextYear, adjustedMonth + 1, 1));
          currentDate = new Date(nextYear, adjustedMonth, daysInNextMonth);
        } else {
          currentDate = new Date(nextYear, adjustedMonth, currentDay);
        }
        break;
      }
      case 'yearly': {
        const nextYear = currentDate.getFullYear() + interval;
        const nextMonth = currentDate.getMonth();
        const nextDay = currentDate.getDate();

        // 2월 29일 처리
        if (nextMonth === 1 && nextDay === 29) {
          currentDate = new Date(nextYear, nextMonth, isLeapYear(nextYear) ? 29 : 28);
        } else {
          currentDate = new Date(nextYear, nextMonth, nextDay);
        }
        break;
      }
      default:
        return repeatEvents;
    }
  }

  return repeatEvents;
};
