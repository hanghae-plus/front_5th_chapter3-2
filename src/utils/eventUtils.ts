import { Event } from '../types';
import { formatDate, getWeekDates, isDateInRange, isValidDate, stripTime } from './dateUtils';

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

  const rangeStartDate = stripTime(rangeStart);
  const rangeEndDate = stripTime(rangeEnd);

  for (const event of events) {
    if (!event.repeat || event.repeat.type === 'none') {
      expanded.push(event);
    } else if (!('originalRepeatId' in event)) {
      const { type, interval, endDate } = event.repeat;

      const repeatEnd = stripTime(isValidDate(endDate) ? new Date(endDate!) : rangeEnd);
      const start = stripTime(new Date(event.date));

      let current = new Date(start);
      let preservedDay: number | null = null;

      while (stripTime(current) <= repeatEnd && stripTime(current) <= rangeEndDate) {
        const strippedCurrent = stripTime(current);

        if (strippedCurrent >= rangeStartDate) {
          const dateStr = formatDate(strippedCurrent);
          const key = `${event.id}_${dateStr}`;

          if (!modifiedMap.has(key)) {
            expanded.push({
              ...event,
              id: `${event.id}_${dateStr}`,
              date: dateStr,
              repeat: event.repeat,
            });
            modifiedMap.set(key, true);
          }
        }

        switch (type) {
          case 'daily':
            current.setDate(current.getDate() + interval);
            break;
          case 'weekly':
            current.setDate(current.getDate() + 7 * interval);
            break;
          case 'monthly': {
            const next = new Date(current);
            next.setDate(1); // 안전하게 1일로 초기화
            next.setMonth(next.getMonth() + interval);

            const originalDay: number = preservedDay ?? start.getDate();
            const maxDays = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();

            if (originalDay > maxDays) {
              next.setDate(1);
              next.setMonth(next.getMonth() + 1);
              preservedDay = 1;
            } else {
              next.setDate(originalDay);
              preservedDay = originalDay;
            }

            current = next;
            break;
          }
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
