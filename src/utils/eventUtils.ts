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

function getLastValidDate(year: number, month: number, day: number): Date {
  const tentative = new Date(year, month, day);
  if (tentative.getMonth() !== month) {
    // day가 유효하지 않은 경우, 이전 달로 넘어갔음 -> 마지막 날로 조정
    return new Date(year, month + 1, 0);
  }
  return tentative;
}

export function getRepeatEvents(event: Event | EventForm) {
  const { repeat, date } = event;
  const repeatEvents: EventForm[] = [];

  const startDate = new Date(date);
  const endDate = new Date(repeat.endDate || '2025-09-30');
  const currentDate = new Date(startDate);
  const originalDay = currentDate.getDate();

  if (repeat.type === 'daily') {
    while (currentDate <= endDate) {
      repeatEvents.push({ ...event, date: formatDate(currentDate) });
      currentDate.setDate(currentDate.getDate() + repeat.interval);
    }
    return repeatEvents;
  }

  if (repeat.type === 'weekly') {
    while (currentDate <= endDate) {
      repeatEvents.push({ ...event, date: formatDate(currentDate) });
      currentDate.setDate(currentDate.getDate() + repeat.interval * 7);
    }
    return repeatEvents;
  }

  if (repeat.type === 'monthly') {
    while (currentDate <= endDate) {
      repeatEvents.push({ ...event, date: formatDate(currentDate) });
      const nextMonth = currentDate.getMonth() + repeat.interval;
      const nextYear = currentDate.getFullYear() + Math.floor(nextMonth / 12);
      const adjustedMonth = nextMonth % 12;
      const newDate = getLastValidDate(nextYear, adjustedMonth, originalDay);
      currentDate.setTime(newDate.getTime());
    }
    return repeatEvents;
  }

  if (repeat.type === 'yearly') {
    while (currentDate <= endDate) {
      repeatEvents.push({ ...event, date: formatDate(currentDate) });
      const nextYear = currentDate.getFullYear() + repeat.interval;
      const newDate = getLastValidDate(nextYear, currentDate.getMonth(), originalDay);
      currentDate.setTime(newDate.getTime());
    }
    return repeatEvents;
  }

  return [event];
}
