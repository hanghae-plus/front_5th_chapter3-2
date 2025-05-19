import { Event } from '../types';
import { getWeekDates, isDateInRange, isValidDate } from './dateUtils';

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

function expandRepeatingEvents(events: Event[], rangeStart: Date, rangeEnd: Date): Event[] {
  const expanded: Event[] = [];
  const modifiedMap = new Map<string, boolean>();

  for (const event of events) {
    if (!event.repeat || event.repeat.type === 'none') {
      expanded.push(event);
    } else if (!('originalRepeatId' in event)) {
      const { type, interval, endDate } = event.repeat;
      const repeatEnd = isValidDate(endDate) ? new Date(endDate!) : new Date('2025-09-30');
      const start = new Date(event.date);

      let current = new Date(start);
      while (current <= repeatEnd && current <= rangeEnd) {
        if (current >= rangeStart) {
          const dateStr = current.toISOString().split('T')[0];
          const key = `${event.id}_${dateStr}`;
          if (!modifiedMap.has(key)) {
            expanded.push({
              ...event,
              id: `${event.id}_${dateStr}`, // 각 반복 회차 고유 ID
              date: dateStr,
              repeat: event.repeat,
            });
          }
        }

        switch (type) {
          case 'daily':
            current.setDate(current.getDate() + interval);
            break;
          case 'weekly':
            current.setDate(current.getDate() + 7 * interval);
            break;
          case 'monthly':
            current.setMonth(current.getMonth() + interval);
            break;
          case 'yearly':
            current.setFullYear(current.getFullYear() + interval);
            break;
        }
      }
    }
  }

  return expanded;
}

export function getFilteredEvents(
  events: Event[],
  searchTerm: string,
  currentDate: Date,
  view: 'week' | 'month'
): Event[] {
  const searchedEvents = searchEvents(events, searchTerm);

  const [rangeStart, rangeEnd] =
    view === 'week'
      ? [getWeekDates(currentDate)[0], getWeekDates(currentDate)[6]]
      : [
          new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
          new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
        ];

  // 반복 일정 포함
  const expandedEvents = expandRepeatingEvents(searchedEvents, rangeStart, rangeEnd);

  if (view === 'week') {
    return filterEventsByDateRangeAtWeek(expandedEvents, currentDate);
  }

  if (view === 'month') {
    return filterEventsByDateRangeAtMonth(expandedEvents, currentDate);
  }

  return expandedEvents;
}
