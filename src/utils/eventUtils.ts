import { Event, EventForm } from '@/types';
import { formatDate, getWeekDates, isDateInRange } from '@/utils/dateUtils';

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

export const createRepeatEvents = (event: Event | EventForm): EventForm[] => {
  // 최대 일자 2025-09-30 ..?
  const events: EventForm[] = [];
  const { type, interval, endDate } = event.repeat;
  if (type === 'none' || interval === 0) return [event];
  const st = new Date(event.date);
  const ed = endDate ? new Date(endDate) : new Date('2026-06-30'); // test

  if (type === 'daily') {
    for (let cur = new Date(st); cur <= ed; cur.setDate(cur.getDate() + interval * 1)) {
      events.push({ ...event, date: formatDate(new Date(cur)) });
    }
  } else if (type === 'weekly') {
    for (let cur = new Date(st); cur <= ed; cur.setDate(cur.getDate() + interval * 7)) {
      events.push({ ...event, date: formatDate(new Date(cur)) });
    }
  } else if (type === 'monthly') {
    for (let cur = new Date(st); cur <= ed; ) {
      events.push({ ...event, date: formatDate(new Date(cur)) });

      const next = new Date(cur);
      next.setMonth(next.getMonth() + interval);
      next.setDate(st.getDate());

      if (next.getDate() !== st.getDate()) {
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
      }

      cur = next;
    }
  }
  return events;
};
