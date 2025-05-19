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

  // api/event-list에 대한 msw handler
  http.post('/api/events-list', async ({ request }) => {
    const { events: newEvents } = (await request.json()) as { events: Event[] };

    const generatedEvents = newEvents.map((event, index) => {
      return {
        ...event,
        id: String(events.length + index + 1),
      };
    });

    events.push(...generatedEvents);
    return HttpResponse.json(generatedEvents, { status: 201 });
  }),

  http.put('/api/events-list', async ({ request }) => {
    const { events: updatedEvents } = (await request.json()) as { events: Event[] };

    updatedEvents.forEach((updated) => {
      const index = events.findIndex((event) => event.id === updated.id);
      if (index !== -1) {
        events[index] = { ...events[index], ...updated };
      }
    });

    return HttpResponse.json({ events });
  }),

  http.delete('/api/events-list', async ({ request }) => {
    const { eventIds } = (await request.json()) as { eventIds: string[] };

    eventIds.forEach((id) => {
      const index = events.findIndex((event) => event.id === id);
      if (index !== -1) {
        events.splice(index, 1);
      }
    });

    return new HttpResponse(null, { status: 204 });
  }),
];
