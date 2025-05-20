import { EventForm, RepeatType } from '../types';

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

export const createRepeatEvents = (baseEvent: EventForm) => {
  const { repeat, ...eventWithoutRepeat } = baseEvent;

  if (repeat.type === 'none') {
    return [baseEvent];
  }

  const events: EventForm[] = [];
  const startDate = new Date(baseEvent.date);
  const endDate = new Date(repeat.endDate || '2025-09-30');
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    events.push({
      ...eventWithoutRepeat,
      date: currentDate.toISOString().split('T')[0],
      repeat: {
        ...repeat,
      },
    });

    currentDate = calculateNextDate(currentDate, repeat.type, repeat.interval);
  }

  return events;
};
