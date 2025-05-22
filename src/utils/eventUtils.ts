import { Event, EventForm, RepeatType } from '../types';
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

export function generateRepeatEvents(
  baseEvent: Omit<EventForm, 'repeat'>,
  repeat: {
    type: RepeatType;
    interval: number;
    endDate: string;
    count?: number;
  }
): EventForm[] {
  const { type, interval, endDate } = repeat;
  const results: EventForm[] = [];

  const startDate = new Date(baseEvent.date);
  const end = new Date(endDate);

  let current = new Date(startDate);
  let count = 0;

  while (current <= end) {
    if (!!repeat.count && count === repeat.count) {
      break;
    }

    results.push({
      ...baseEvent,
      date: current.toISOString().split('T')[0],
      repeat: {
        type,
        interval,
        count: repeat.count,
      },
    });

    let nextDate = new Date(current);

    switch (type) {
      case 'daily':
        nextDate.setDate(current.getDate() + interval);
        break;
      case 'weekly':
        nextDate.setDate(current.getDate() + 7 * interval);
        break;
      case 'monthly':
        nextDate.setMonth(current.getMonth() + interval);
        break;
      case 'yearly':
        nextDate.setFullYear(current.getFullYear() + interval);
        break;
    }

    current = nextDate;
    count++;
  }

  return results;
}

export async function saveRepeatingSchedule(
  baseEvent: Omit<EventForm, 'repeat'>,
  repeat: {
    type: RepeatType;
    interval: number;
    endDate: string;
    count?: number;
  }
) {
  const events = generateRepeatEvents(baseEvent, repeat);

  const response = await fetch('/api/events-list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events }),
  });

  if (!response.ok) {
    throw new Error('Failed to save repeating events');
  }

  return await response.json();
}
