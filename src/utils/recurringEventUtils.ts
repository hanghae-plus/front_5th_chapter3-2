import { isBefore, addDays, addMonths, addYears } from 'date-fns';

import { Event } from '../types';

export const generateRecurringEvents = (event: Omit<Event, 'id'>): Event[] => {
  if (!event.repeat || event.repeat.type === 'none') {
    return [];
  }

  const events: Event[] = [];
  const startDate = new Date(event.date);
  const endDate = event.repeat.endDate ? new Date(event.repeat.endDate) : new Date();

  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    events.push({
      ...event,
      id: `event-${Date.now()}-${events.length}`,
      date: currentDate.toISOString().split('T')[0],
      repeat: {
        ...event.repeat,
      },
    });

    switch (event.repeat.type) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + event.repeat.interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7 * event.repeat.interval);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + event.repeat.interval);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + event.repeat.interval);
        break;
    }
  }

  return events;
};

/**
 * form에서 작성한 event를 기반으로 반복 이벤트 리스트 생성
 * @param event 반복 일정으로 설정된 이벤트
 */
export const createRecurringEvents = (event: Event) => {
  const { repeat, ...rest } = event;
  const { type, interval, endDate: formEndDate } = repeat;

  const events = [];

  let startDate = new Date(rest.date);
  const endDate = formEndDate ? new Date(formEndDate) : new Date('2025-09-25');

  console.log('startDate, endDate, type, interval', startDate, endDate, type, interval);

  if (type === 'daily') {
    while (isBefore(startDate, endDate)) {
      events.push({
        ...event,
        date: startDate.toISOString(),
        repeat: { ...repeat, id: repeat.id },
      });
      startDate = addDays(startDate, interval);
    }
  }

  if (type === 'weekly') {
    while (isBefore(startDate, endDate)) {
      events.push({
        ...event,
        date: startDate.toISOString(),
        repeat: { ...repeat, id: repeat.id },
      });
      startDate = addDays(startDate, interval * 7);
    }
  }

  if (type === 'monthly') {
    while (isBefore(startDate, endDate)) {
      events.push({
        ...event,
        date: startDate.toISOString(),
        repeat: { ...repeat, id: repeat.id },
      });
      startDate = addMonths(startDate, interval);
    }
  }

  if (type === 'yearly') {
    while (isBefore(startDate, endDate)) {
      events.push({
        ...event,
        date: startDate.toISOString(),
        repeat: { ...repeat, id: repeat.id },
      });
      startDate = addYears(startDate, interval);
    }
  }

  return events;
};

/**
 * 반복 이벤트 업데이트
 * @param events 기존 반복 이벤트 리스트
 * @param updatedRecurringEvents 업데이트된 반복 이벤트 리스트
 * @returns 업데이트된 반복 이벤트 리스트
 */
export const updateRecurringEvents = (events: Event[], updatedRecurringEvents: Event[]) => {
  if (updatedRecurringEvents.length === 0) {
    return events;
  }

  const repeatId = updatedRecurringEvents[0].repeat.id;

  updatedRecurringEvents.map((event) => (event.repeat.id = repeatId));

  const filteredEvents = events.filter((e) => e.repeat.id !== repeatId);
  return [...filteredEvents, ...updatedRecurringEvents];
};

/**
 * 반복 이벤트 삭제
 * @param eventId 삭제할 이벤트의 id
 * @param events 기존 반복 이벤트 리스트
 * @returns 삭제할 이벤트의 id 리스트
 */
export const getRecurringEventIdsForDelete = (eventId: string, events: Event[]) => {
  const repeatId = events.find((event) => event.id === eventId)?.repeat.id;
  return events.filter((event) => event.repeat.id === repeatId).map((event) => event.id);
};

/**
 * 이벤트가 반복 이벤트인지 확인
 * @param id 이벤트의 id
 * @param events 이벤트 리스트
 * @returns 이벤트가 반복 이벤트인지 여부
 */
export const checkEventIsRecurring = (id: string, events: Event[]) => {
  return events.find((event) => event.id === id)?.repeat.type !== 'none';
};
