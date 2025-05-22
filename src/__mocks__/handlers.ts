import { http, HttpResponse } from 'msw';
import { v4 as uuidv4 } from 'uuid';

import { events } from '../__mocks__/response/events.json' assert { type: 'json' };
import { Event } from '../types';

export const handlers = [
  http.get('/api/events', () => {
    console.log('🚀 handlers "getEvents"');
    return HttpResponse.json({ events });
  }),

  http.post('/api/events', async ({ request }) => {
    const newEvent = (await request.json()) as Event;
    newEvent.id = String(events.length + 1);
    return HttpResponse.json(newEvent, { status: 201 });
  }),

  http.put('/api/events/:id', async ({ params, request }) => {
    const { id } = params;
    const updatedEvent = (await request.json()) as Event;
    const index = events.findIndex((event) => event.id === id);

    if (index !== -1) {
      return HttpResponse.json({ ...events[index], ...updatedEvent });
    }

    return new HttpResponse(null, { status: 404 });
  }),

  http.delete('/api/events/:id', ({ params }) => {
    const { id } = params;
    const index = events.findIndex((event) => event.id === id);

    if (index !== -1) {
      return new HttpResponse(null, { status: 204 });
    }

    return new HttpResponse(null, { status: 404 });
  }),

  http.post('/api/events-list', async ({ request }) => {
    const event = (await request.json()) as Event;

    const repeatId = uuidv4();
    const newEvents = expandRepeatingEvent(event, repeatId);

    return HttpResponse.json(newEvents, { status: 201 });
  }),
];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function expandRepeatingEvent(event: Event, repeatId: string): Event[] {
  const result: Event[] = [];

  const repeat = event.repeat;
  if (!repeat || repeat.type === 'none') return [{ ...event, id: uuidv4() }];

  const interval = repeat.interval || 1;
  const startDate = new Date(event.date);
  const endDate = new Date(repeat.endDate!);
  const originalDay = startDate.getDate();

  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    let adjustedDate = new Date(currentDate);

    // 윤년 처리 (2월 29일 → 2월 28일)
    if (
      repeat.type === 'yearly' &&
      startDate.getMonth() === 1 &&
      startDate.getDate() === 29 &&
      !isLeapYear(currentDate.getFullYear())
    ) {
      adjustedDate = new Date(currentDate.getFullYear(), 1, 28);
    }

    // 31일이 없는 달 보정
    if (repeat.type === 'monthly' || repeat.type === 'yearly') {
      const daysInMonth = new Date(
        adjustedDate.getFullYear(),
        adjustedDate.getMonth() + 1,
        0
      ).getDate();
      const correctedDay = Math.min(originalDay, daysInMonth);
      adjustedDate = new Date(adjustedDate.getFullYear(), adjustedDate.getMonth(), correctedDay);
    }

    result.push({
      ...event,
      id: uuidv4(),
      date: toISODateString(adjustedDate),
      repeat: {
        ...repeat,
        id: repeatId,
      },
    });

    // 다음 반복 날짜 계산
    const temp = new Date(currentDate);

    switch (repeat.type) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7 * interval);
        break;
      case 'monthly':
        currentDate = new Date(temp);
        currentDate.setDate(1);
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + interval);
        break;
    }
  }

  return result;
}
