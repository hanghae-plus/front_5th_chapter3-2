import { Event, EventForm, RepeatType } from '../types';
import { calculateRepeatNextDate, formatDateToYYYYMMDD } from './dateUtils';

import { DEFAULT_EVENT_FORM } from '@/constants/form';

export function convertEventToForm(event: Event): EventForm {
  const { id, ...eventWithoutId } = event;

  return {
    ...DEFAULT_EVENT_FORM,
    ...Object.fromEntries(Object.entries(eventWithoutId).filter(([_, value]) => value != null)),
    repeat: {
      ...DEFAULT_EVENT_FORM.repeat,
      ...(event.repeat || {}),
    },
  };
}

export function convertFormToEventData(
  eventForm: EventForm,
  isRepeating: boolean,
  editingEvent: Event | null
): Event | EventForm {
  return {
    ...(editingEvent ? { id: editingEvent.id } : {}),
    ...eventForm,
    repeat: {
      ...eventForm.repeat,
      type: editingEvent ? eventForm.repeat.type : isRepeating ? eventForm.repeat.type : 'none',
      endDate: eventForm.repeat.endDate || undefined,
    },
  };
}

export function convertFormToEventDataRepeating(
  eventForm: EventForm,
  editingEvent: Event | null
): Event[] | EventForm[] {
  const { type, interval, endDate } = eventForm.repeat;

  const intervalNum = typeof interval === 'number' ? interval : Number(interval) || 1;

  if (type !== 'none' && endDate) {
    const events = [];

    events.push({
      ...(editingEvent ? { id: editingEvent.id } : {}),
      ...eventForm,
      repeat: {
        ...eventForm.repeat,
        type,
        interval: intervalNum,
        endDate: endDate || undefined,
      },
    });

    const startDate = new Date(`${eventForm.date}T${eventForm.startTime}`);
    const endDateObj = new Date(endDate);

    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.ceil((endDateObj.getTime() - startDate.getTime()) / msPerDay);

    const maxRepetitionsBase = calculateMaxRepetitions(type, diffDays, intervalNum);
    const maxRepetitions = Math.min(maxRepetitionsBase, 100);

    const repeatedEvents = Array.from({ length: maxRepetitions })
      .map((_, i) => {
        const nextDate = calculateRepeatNextDate(
          startDate,
          i,
          type,
          intervalNum,
          startDate.getDate()
        );
        return { date: nextDate, isValid: nextDate <= endDateObj };
      })
      .filter((item) => item.isValid)
      .map((item) => createRepeatedEvent(eventForm, item.date, type, intervalNum, endDate));

    events.push(...repeatedEvents);
    return events;
  }

  return [
    {
      ...(editingEvent ? { id: editingEvent.id } : {}),
      ...eventForm,
      repeat: {
        ...eventForm.repeat,
        type,
        interval: intervalNum,
        endDate: endDate || undefined,
      },
    },
  ];
}

const calculateMaxRepetitions = (repeatType: string, days: number, interval: number): number => {
  switch (repeatType) {
    case 'daily':
      return Math.ceil(days / interval);
    case 'weekly':
      return Math.ceil(days / (7 * interval));
    case 'monthly':
      return Math.ceil(days / (30 * interval));
    case 'yearly':
      return Math.ceil(days / (365 * interval));
    default:
      return 100;
  }
};

const createRepeatedEvent = (
  baseEvent: EventForm,
  date: Date,
  repeatType: RepeatType,
  intervalNum: number,
  endDate?: string
): EventForm => {
  return {
    ...baseEvent,
    date: formatDateToYYYYMMDD(date),
    repeat: {
      ...baseEvent.repeat,
      type: repeatType,
      interval: intervalNum,
      endDate: endDate || undefined,
    },
  };
};
