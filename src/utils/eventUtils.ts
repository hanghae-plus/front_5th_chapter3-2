import { Event } from '../types';
import { formatDate, getWeekDates, isDateInRange, getNewDateByInterval } from './dateUtils';

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

export function createRepeatedEvents(event: Event, maxCount?: number) {
  const {
    date,
    repeat: { interval, type: repeatType, endDate: endDateStr },
  } = event;
  const events: Event[] = [];
  const endDate = endDateStr ? new Date(endDateStr) : new Date('2025-09-30');
  let currentDate = new Date(date);
  let count = 0;

  while (currentDate <= endDate && (maxCount === undefined || count < maxCount)) {
    events.push({
      ...event,
      date: formatDate(currentDate),
    });
    currentDate = getNewDateByInterval(currentDate, repeatType, interval);
    count++;
  }

  return events;
}
