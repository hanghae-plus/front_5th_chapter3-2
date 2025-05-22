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
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();

    let adjustedDate = new Date(currentDate);

    if (repeat.type === 'yearly' && month === 1 && day === 29 && !isLeapYear(year)) {
      adjustedDate = new Date(year, 1, 28);
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

    switch (repeat.type) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7 * interval);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;
      case 'yearly':
        // eslint-disable-next-line no-case-declarations
        const originalMonth = startDate.getMonth();
        // eslint-disable-next-line no-case-declarations
        const originalDate = startDate.getDate();

        currentDate.setFullYear(currentDate.getFullYear() + interval);

        if (
          originalMonth === 1 &&
          originalDate === 29 &&
          (currentDate.getMonth() !== 1 || currentDate.getDate() !== 29)
        ) {
          currentDate = new Date(currentDate.getFullYear(), 1, 28);
        }

        break;
    }
  }

  return result;
}
