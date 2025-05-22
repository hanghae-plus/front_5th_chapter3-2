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
    const { events: newEvents } = (await request.json()) as { events: Event[] };
    const repeatId = String(Date.now());

    const eventsWithIds = newEvents.map((event) => {
      const isRepeatEvent = event.repeat.type !== 'none';
      const { id, ...eventWithoutId } = event;
      return {
        ...eventWithoutId,
        id: String(events.length + 1 + Math.random()),
        repeat: {
          ...event.repeat,
          id: isRepeatEvent ? repeatId : undefined,
        },
      };
    });

    events.push(...eventsWithIds);

    return HttpResponse.json(eventsWithIds, { status: 201 });
  }),

  http.put('/api/events-list', async ({ request }) => {
    const { events: updatedEvents } = (await request.json()) as { events: Event[] };
    let isUpdated = false;

    updatedEvents.forEach((updatedEvent) => {
      const index = events.findIndex((event) => event.id === updatedEvent.id);
      if (index !== -1) {
        isUpdated = true;
        events[index] = { ...events[index], ...updatedEvent };
      }
    });

    if (isUpdated) {
      return HttpResponse.json(events);
    }

    return new HttpResponse(null, { status: 404 });
  }),

  http.delete('/api/events-list', async ({ request }) => {
    const { eventIds } = (await request.json()) as { eventIds: string[] };

    const remainingEvents = events.filter((event) => !eventIds.includes(event.id));
    events.length = 0;
    events.push(...remainingEvents);

    return new HttpResponse(null, { status: 204 });
  }),
];
