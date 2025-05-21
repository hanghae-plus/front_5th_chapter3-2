import { Event, EventForm } from '../types';
import { formatDate, getDateByInterval, getWeekDates, isDateInRange } from './dateUtils';

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

export function generateRepeatEvents(event: Event | EventForm) {
  const repeatEvents = [];
  let currentDate = new Date(event.date);

  if (event.repeatEnd?.type === 'endCount' && event.repeatEnd.endCount) {
    let count = 0;
    while (count < event.repeatEnd.endCount) {
      repeatEvents.push({
        ...event,
        date: formatDate(currentDate),
      });
      currentDate = getDateByInterval(currentDate, event.repeat.type, event.repeat.interval);
      count++;
    }
  } else {
    const repeatEndDate = event.repeatEnd?.endDate
      ? new Date(event.repeatEnd.endDate)
      : new Date('2025-09-30');

    while (currentDate <= repeatEndDate) {
      repeatEvents.push({
        ...event,
        date: formatDate(currentDate),
      });
      currentDate = getDateByInterval(currentDate, event.repeat.type, event.repeat.interval);
    }
  }

  return repeatEvents;
}

export function getAllRepeatEventsIds(repeatId: string, events: Event[]) {
  const result = events
    .map((event) => {
      if (event.repeat.id === repeatId) return event.id;

      return null;
    })
    .filter(Boolean);

  return result;
}
