import { EventForm, Event, RepeatType } from '../types';

type DateCalculator = (date: Date, interval: number) => void;

const dateCalculators: Record<RepeatType, DateCalculator> = {
  none: () => {}, // none은 사용되지 않음
  daily: (date, interval) => date.setDate(date.getDate() + interval),
  weekly: (date, interval) => date.setDate(date.getDate() + 7 * interval),
  monthly: (date, interval) => date.setMonth(date.getMonth() + interval),
  yearly: (date, interval) => date.setFullYear(date.getFullYear() + interval),
};

const calculateNextDate = (currentDate: Date, repeatType: RepeatType, interval: number): Date => {
  const nextDate = new Date(currentDate);
  dateCalculators[repeatType](nextDate, interval);
  return nextDate;
};

export const createRepeatEvents = (event: Event | EventForm) => {
  const { repeat, date } = event;
  const { type, interval, endDate } = repeat;

  if (type === 'none') {
    return [event];
  }

  const repeatEndDate = endDate ? new Date(endDate) : new Date('2025-09-30');
  let currentDate = new Date(date);

  const repeatEvents: (Event | EventForm)[] = [];

  while (currentDate <= repeatEndDate) {
    repeatEvents.push({
      ...event,
      date: currentDate.toISOString().split('T')[0],
      repeat: {
        type,
        interval,
        endDate,
      },
    });

    currentDate = calculateNextDate(currentDate, type, interval);
  }

  return repeatEvents;
};
