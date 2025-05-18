import { http, HttpResponse } from 'msw';

import { events } from '../__mocks__/response/events.json' assert { type: 'json' };
import { Event, EventForm } from '../types';

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
    const repeatId = String(events.length + 1);
    const { events: eventsToCreate } = (await request.json()) as { events: EventForm[] };
    const newEvents = eventsToCreate.map((event, index) => {
      const isRepeatEvent = event.repeat.type !== 'none';
      return {
        id: String(events.length + 1 + index),
        ...event,
        repeat: {
          ...event.repeat,
          id: isRepeatEvent ? repeatId : undefined,
        },
      };
    });

    return HttpResponse.json(newEvents, { status: 201 });
  }),

  http.put('/api/events-list', async ({ request }) => {
    const { events: eventsToUpdate } = (await request.json()) as { events: Event[] };
    const updatedEvents: Event[] = [];
    let isUpdated = false;

    eventsToUpdate.forEach((event) => {
      const eventIndex = events.findIndex((target) => target.id === event.id);
      if (eventIndex > -1) {
        isUpdated = true;
        updatedEvents.push({ ...events[eventIndex], ...event });
      }
    });

    if (isUpdated) {
      return HttpResponse.json(updatedEvents, { status: 201 });
    }

    return new HttpResponse(null, { status: 404 });
  }),

  http.delete('api/events-list', async ({ request }) => {
    const { eventIds: eventIdsToDelete } = (await request.json()) as { eventIds: string[] };
    const deletedEvents = events.filter((event) => eventIdsToDelete.includes(event.id));
    const isDeleted = deletedEvents.length === eventIdsToDelete.length;

    if (isDeleted) {
      return new HttpResponse(null, { status: 204 });
    }

    return new HttpResponse(null, { status: 404 });
  }),
];
