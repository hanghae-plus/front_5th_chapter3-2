import { http, HttpResponse } from 'msw';

import { events } from '../__mocks__/response/events.json' assert { type: 'json' };
import { Event, Repeat } from '../types';

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
    const incoming = (await request.json()) as Event[];
    const repeatId = String(Math.random());

    const newRepeatEvents = incoming.map((ev) => ({
      ...ev,
      id: repeatId,
      repeat:
        ev.repeat.type !== 'none'
          ? { ...ev.repeat, id: String(Math.random()) }
          : { ...ev.repeat, id: undefined },
    }));

    events.push(...newRepeatEvents);

    return HttpResponse.json(newRepeatEvents, { status: 201 });
  }),

  http.put('/api/events-list/:id', async ({ params, request }) => {
    const { id } = params;
    const updates = (await request.json()) as Partial<Event> & { repeat?: Repeat };

    const target = events.find((ev) => ev.id === id);
    if (!target) {
      return new HttpResponse(null, { status: 404 });
    }

    if (updates.repeat?.type === 'none') {
      target.repeat = {
        ...target.repeat,
        type: 'none',
        id: undefined,
        ...updates.repeat,
      };
    } else {
      Object.assign(target, {
        ...updates,
        repeat: {
          ...target.repeat,
          ...updates.repeat,
        },
      });
    }

    return HttpResponse.json(target);
  }),

  http.delete('/api/events-list/:id', ({ params }) => {
    const { id } = params;
    const index = events.findIndex((event) => event.id === id);

    if (index !== -1) {
      return new HttpResponse(null, { status: 204 });
    }
    return new HttpResponse(null, { status: 404 });
  }),
];
