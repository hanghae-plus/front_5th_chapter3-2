import { Event } from '../types';
import { getDaysInMonth, getWeekDates, isDateInRange } from './dateUtils';

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
export function getRepeatEvents(event: Event): Event[] {
  const events: Event[] = [];
  const { type, interval } = event.repeat;

  const startDate = new Date(event.date);
  const endDateObj = new Date(event.repeat.endDate ?? '2025-09-30');

  let currentDate = new Date(startDate);
  console.log('currentDate: ', currentDate);
  console.log('endDateObj: ', endDateObj);

  // 반복 종료 조건이 횟수일 떄
  if (event.repeat?.endType === 'endcount' && event.repeat.endCount) {
    let count = 0;
    if (type === 'daily') {
      while (count < event.repeat.endCount) {
        events.push({
          ...event,
          date: currentDate.toISOString().split('T')[0],
        });
        currentDate.setDate(currentDate.getDate() + interval);
        count++;
      }
    } else if (type === 'weekly') {
      while (count < event.repeat.endCount) {
        events.push({ ...event, date: currentDate.toISOString().split('T')[0] });
        currentDate.setDate(currentDate.getDate() + interval * 7);
        count++;
      }
    } else if (type === 'monthly') {
      while (count < event.repeat.endCount) {
        events.push({ ...event, date: currentDate.toISOString().split('T')[0] });
        currentDate.setMonth(currentDate.getMonth() + interval); // setDate가 아닌 setMonth 사용
        count++;
      }
    } else if (type === 'yearly') {
      while (count < event.repeat.endCount) {
        events.push({ ...event, date: currentDate.toISOString().split('T')[0] });
        currentDate.setFullYear(currentDate.getFullYear() + interval);
        count++;
      }
    }
  } else {
    if (type === 'daily') {
      while (currentDate <= endDateObj) {
        events.push({ ...event, date: currentDate.toISOString().split('T')[0] });
        currentDate.setDate(currentDate.getDate() + interval);
      }
    } else if (type === 'weekly') {
      while (currentDate <= endDateObj) {
        events.push({ ...event, date: currentDate.toISOString().split('T')[0] });
        currentDate.setDate(currentDate.getDate() + interval * 7);
      }
    } else if (type === 'monthly') {
      const day = startDate.getDate();
      let year = startDate.getFullYear();
      let month = startDate.getMonth();
      let lastDayOfMonth = getDaysInMonth(year, month);
      let eventDay = Math.min(day, lastDayOfMonth);

      let nextDate = new Date(year, month, eventDay);

      while (nextDate <= endDateObj) {
        events.push({ ...event, date: nextDate.toISOString().split('T')[0] });
        // 다음 반복
        month += interval;
        while (month >= 12) {
          month -= 12;
          year += 1;
        }
        lastDayOfMonth = getDaysInMonth(year, month + 1);
        eventDay = Math.min(day, lastDayOfMonth);
        nextDate = new Date(year, month, eventDay);
      }
    } else if (type === 'yearly') {
      while (currentDate <= endDateObj) {
        events.push({ ...event, date: currentDate.toISOString().split('T')[0] });
        currentDate.setFullYear(currentDate.getFullYear() + interval);
      }
    }
  }

  return events;
}
