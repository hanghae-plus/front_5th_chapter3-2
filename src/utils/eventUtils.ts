import { Event, EventForm } from '../types';
import { getWeekDates, isDateInRange, formatDate } from './dateUtils';

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

export function getRepeatedEvents(event: EventForm) {
  const { date, repeat } = event;
  const { type, interval, endDate } = repeat;
  const finalEndDate = endDate ? new Date(endDate) : new Date('2048-12-31');
  const repeatedEvents: EventForm[] = [];
  let originMonth = new Date(date).getMonth(),
    originDate = new Date(date).getDate();
  let currentDate = new Date(date);

  switch (type) {
    case 'daily':
      while (currentDate <= finalEndDate) {
        repeatedEvents.push({ ...event, date: formatDate(new Date(currentDate)) });

        currentDate.setDate(currentDate.getDate() + interval);
      }
      break;
    case 'weekly':
      while (currentDate <= finalEndDate) {
        repeatedEvents.push({ ...event, date: formatDate(new Date(currentDate)) });

        currentDate.setDate(currentDate.getDate() + 7 * interval);
      }
      break;
    case 'monthly':
      while (currentDate <= finalEndDate) {
        repeatedEvents.push({ ...event, date: formatDate(new Date(currentDate)) });

        const currentMonth = currentDate.getMonth();
        const nextDate = currentDate;
        nextDate.setMonth(nextDate.getMonth() + interval);

        if (currentMonth !== currentDate.getMonth()) {
          currentDate.setDate(originDate);
        }
        currentDate.setMonth(nextDate.getMonth());
      }
      break;
    case 'yearly':
      while (currentDate <= finalEndDate) {
        if (currentDate.getDate() === originDate) {
          repeatedEvents.push({ ...event, date: formatDate(new Date(currentDate)) });
        }

        const nextDate = currentDate;
        nextDate.setFullYear(nextDate.getFullYear() + interval);

        if (originMonth !== currentDate.getMonth()) {
          currentDate.setMonth(originMonth);
          currentDate.setDate(originDate);
        }
        currentDate.setFullYear(nextDate.getFullYear());
      }
      break;
  }

  return repeatedEvents;
}
