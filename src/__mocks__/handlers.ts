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
    const newEvents = (await request.json()) as { events: Event[] };
    const eventList: Event[] = newEvents.events.map((event, index) => ({
      ...event,
      id: String(events.length + index + 1),
    }));
    return HttpResponse.json(eventList, { status: 201 });
  }),

  http.put('/api/events-list', async ({ request }) => {
    const updatedEvents = (await request.json()) as { events: Event[] };
    const eventList = [...updatedEvents.events];
    let isUpdated = false;
    updatedEvents.events.forEach((event) => {
      const index = eventList.findIndex((target) => target.id === event.id);
      if (index !== -1) {
        isUpdated = true;
        eventList[index] = { ...eventList[index], ...event };
      }
    });

    if (isUpdated) {
      return HttpResponse.json(eventList, { status: 200 });
    }

    return new HttpResponse(null, { status: 404 });
  }),

  http.delete('/api/events-list', async ({ request }) => {
    const deletedEvents = (await request.json()) as { eventIds: string[] };
    const eventList = [...events];
    const afterDeletedEvents = eventList.filter(
      (event) => !deletedEvents.eventIds.includes(event.id)
    );
    return HttpResponse.json(afterDeletedEvents, { status: 204 });
  }),
];
