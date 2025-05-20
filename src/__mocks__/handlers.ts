import { randomUUID } from 'crypto';

import { http, HttpResponse } from 'msw';

import { events } from '../__mocks__/response/events.json' assert { type: 'json' };
import { Event } from '../types';

export const handlers = [
  http.get('/api/events', () => {
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
    const body = (await request.json()) as { events: Event[] };
    const events = body.events as Event[];
    const repeatId = randomUUID();
    const newEvents = events.map((event) => {
      const isRepeatEvent = event.repeat?.type !== 'none';
      return {
        ...event,
        id: randomUUID(),
        repeat: {
          ...event.repeat,
          id: isRepeatEvent ? repeatId : undefined,
        },
      };
    });

    return HttpResponse.json(newEvents, { status: 201 });
  }),

  http.put('/api/events-list', async ({ request }) => {
    const body = (await request.json()) as { events: Event[] };
    const updatedEvents = body.events as Event[];

    let isUpdated = false;
    const newEvents = [...events];

    updatedEvents.forEach((event) => {
      const eventIndex = newEvents.findIndex((e) => e.id === event.id);

      if (eventIndex > -1) {
        isUpdated = true;
        newEvents[eventIndex] = { ...newEvents[eventIndex], ...event };
      }
    });

    if (isUpdated) {
      events.length = 0;
      events.push(...newEvents);
      return HttpResponse.json({ events: events });
    }

    return new HttpResponse(null, { status: 400 });
  }),

  http.delete('/api/events-list', async ({ request }) => {
    const body = (await request.json()) as { eventIds: string[] };

    const filtered = events.filter((e) => !body.eventIds.includes(e.id));
    events.length = 0;
    events.push(...filtered);

    return HttpResponse.json(null, { status: 204 });
  }),
];
