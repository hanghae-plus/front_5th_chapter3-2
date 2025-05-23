import { Event, EventForm } from '../types';
import { formatDate, getWeekDates, isDateInRange } from './dateUtils';

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

export function getRepeatDayEvents(repeatEndDate: Date, event: EventForm) {
  const { date, repeat } = event;
  const repeatedEvents: EventForm[] = [];
  const currentDate = new Date(date);

  while (currentDate <= repeatEndDate) {
    repeatedEvents.push({ ...event, date: formatDate(new Date(currentDate)) });

    currentDate.setDate(currentDate.getDate() + repeat.interval);
  }

  return repeatedEvents;
}

export function getRepeatWeekEvents(repeatEndDate: Date, event: EventForm) {
  const { date, repeat } = event;
  const repeatedEvents: EventForm[] = [];
  const currentDate = new Date(date);

  while (currentDate <= repeatEndDate) {
    repeatedEvents.push({ ...event, date: formatDate(new Date(currentDate)) });

    currentDate.setDate(currentDate.getDate() + 7 * repeat.interval);
  }

  return repeatedEvents;
}

export function getRepeatMonthEvents(repeatEndDate: Date, event: EventForm) {
  const { date, repeat } = event;
  const repeatedEvents: EventForm[] = [];
  const originDate = new Date(date).getDate();
  let currentDate = new Date(date);

  while (currentDate <= repeatEndDate) {
    repeatedEvents.push({ ...event, date: formatDate(new Date(currentDate)) });

    const nextDate = new Date(currentDate);
    nextDate.setMonth(nextDate.getMonth() + repeat.interval);

    if (nextDate.getDate() !== originDate) {
      nextDate.setDate(originDate);
    }
    currentDate = nextDate;
  }

  return repeatedEvents;
}

export function getRepeatYearEvents(repeatEndDate: Date, event: EventForm) {
  const { date, repeat } = event;
  const repeatedEvents: EventForm[] = [];
  const originMonth = new Date(date).getMonth();
  const originDate = new Date(date).getDate();
  let currentDate = new Date(date);

  while (currentDate <= repeatEndDate) {
    if (currentDate.getDate() === originDate) {
      repeatedEvents.push({ ...event, date: formatDate(new Date(currentDate)) });
    }

    const nextDate = new Date(currentDate);
    nextDate.setFullYear(nextDate.getFullYear() + repeat.interval);

    if (originMonth !== currentDate.getMonth()) {
      nextDate.setMonth(originMonth);
      nextDate.setDate(originDate);
    }
    currentDate = nextDate;
  }
  return repeatedEvents;
}
export function getRepeatEvents(event: EventForm) {
  const { repeat } = event;
  const { type, endDate } = repeat;
  const INFINITY_DATE = '2025-09-30';
  const lastDate = endDate ? new Date(endDate) : new Date(INFINITY_DATE);

  switch (type) {
    case 'daily':
      return getRepeatDayEvents(lastDate, event);
    case 'weekly':
      return getRepeatWeekEvents(lastDate, event);
    case 'monthly':
      return getRepeatMonthEvents(lastDate, event);
    case 'yearly':
      return getRepeatYearEvents(lastDate, event);
    default:
      return [];
  }
}
