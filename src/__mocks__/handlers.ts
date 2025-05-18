import { http, HttpResponse } from 'msw';

// TODO: import 하면서 json 파일 타입 지정 방법 찾아보기
import { events } from '../__mocks__/response/events.json' assert { type: 'json' };
import type { Event } from '../types';

const typedEvents = events as Event[];

export const handlers = [
  http.get('/api/events', () => {
    return HttpResponse.json({ events: typedEvents });
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
    const data = (await request.json()) as { events: Event[] };
    const newEvents = data.events;

    const startNumId = events.length + 1;
    const repeatNumId =
      typedEvents.reduce((maxId, event) => {
        const repeatInfo = event.repeat;
        if (repeatInfo.type !== 'none') {
          return Math.max(maxId, Number(repeatInfo.id as string));
        }

        return maxId;
      }, 0) + 1;

    const newEventsWithId = newEvents.map((event, i) => {
      const isRepeatEvent = event.repeat.type !== 'none';

      return {
        ...event,
        id: String(startNumId + i),
        repeat: {
          ...event.repeat,
          id: isRepeatEvent ? String(repeatNumId) : undefined,
        },
      };
    });

    return HttpResponse.json(newEventsWithId, { status: 201 });
  }),
];
