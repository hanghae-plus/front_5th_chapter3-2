import { http, HttpResponse } from 'msw';

import { events } from '../__mocks__/response/events.json' assert { type: 'json' };
import { Event } from '../types';

export const handlers = [
  http.get('/api/events', () => HttpResponse.json({ events })),

  http.post('/api/events', async ({ request }) => {
    const newEvent = (await request.json()) as Event;
    newEvent.id = String(events.length + 1);
    return HttpResponse.json(newEvent, { status: 201 });
  }),

  http.post('/api/events-list', async ({ request }) => {
    const repeatId = `repeat-${events.length + 1}`;
    const { events: eventsToAdd } = (await request.json()) as { events: Event[] };
    const newEvents = eventsToAdd.map((event) => {
      const isRepeatEvent = event.repeat.type !== 'none';
      return {
        ...event,
        repeat: {
          ...event.repeat,
          id: isRepeatEvent ? repeatId : undefined,
        },
      };
    });

    return HttpResponse.json(newEvents, { status: 201 });
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
];
