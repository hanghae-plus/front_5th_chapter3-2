import { Event, EventForm } from '../types';

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addWeeks = (date: Date, weeks: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
};

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const addYears = (date: Date, years: number): Date => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

const isEvent = (event: Event | EventForm): event is Event => {
  return 'id' in event;
};

export const makeRepeatEventList = (event: Event | EventForm): Event[] => {
  if (event.repeat.type === 'none') {
    return isEvent(event) ? [event] : [{ ...event, id: crypto.randomUUID() }];
  }

  const startDate = new Date(event.date);
  const endDate = event.repeat.endDate ? new Date(event.repeat.endDate) : null;

  if (endDate && endDate < startDate) {
    return [];
  }

  const events: Event[] = [];
  let currentDate = new Date(startDate);
  const interval = event.repeat.interval;

  while (!endDate || currentDate <= endDate) {
    const newEvent: Event = {
      ...event,
      id: crypto.randomUUID(),
      date: currentDate.toISOString().split('T')[0],
      repeat: {
        ...event.repeat,
      },
    };
    events.push(newEvent);

    switch (event.repeat.type) {
      case 'daily':
        currentDate = addDays(currentDate, interval);
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, interval);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, interval);
        break;
      case 'yearly':
        currentDate = addYears(currentDate, interval);
        break;
      default:
        return events;
    }
  }

  return events;
};
