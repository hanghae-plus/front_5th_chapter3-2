import { randomUUID } from 'crypto';

import { http, HttpResponse } from 'msw';

import { server } from '../setupTests';
import { Event } from '../types';
import { mockEventsData } from './mockEvent';

// ! Hard 여기 제공 안함
export const setupMockHandlerCreation = (initEvents = [] as Event[]) => {
  const mockEvents: Event[] = [...initEvents];

  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEvents });
    }),
    http.post('/api/events', async ({ request }) => {
      const newEvent = (await request.json()) as Event;
      newEvent.id = String(mockEvents.length + 1); // 간단한 ID 생성
      mockEvents.push(newEvent);
      return HttpResponse.json(newEvent, { status: 201 });
    })
  );
};

export const setupMockHandlerEventListCreation = (initEvents = [] as Event[]) => {
  const mockEvents: Event[] = [...initEvents];
  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEvents });
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

      mockEvents.push(...newEvents);

      return HttpResponse.json(newEvents, { status: 201 });
    })
  );
};

export const setupMockHandlerUpdating = () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      title: '기존 회의',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
    {
      id: '2',
      title: '기존 회의2',
      date: '2025-10-15',
      startTime: '11:00',
      endTime: '12:00',
      description: '기존 팀 미팅 2',
      location: '회의실 C',
      category: '업무 회의',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 5,
    },
  ];

  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEvents });
    }),
    http.put('/api/events/:id', async ({ params, request }) => {
      const { id } = params;
      const updatedEvent = (await request.json()) as Event;
      const index = mockEvents.findIndex((event) => event.id === id);

      mockEvents[index] = { ...mockEvents[index], ...updatedEvent };
      return HttpResponse.json(mockEvents[index]);
    })
  );
};

export const setupMockHandlerEventListUpdating = () => {
  let mockEvents: Event[] = [
    {
      id: '1',
      title: '기존 회의',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
    {
      id: '2',
      title: '기존 회의2',
      date: '2025-10-15',
      startTime: '11:00',
      endTime: '12:00',
      description: '기존 팀 미팅 2',
      location: '회의실 C',
      category: '업무 회의',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 5,
    },
  ];

  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEvents });
    }),
    http.put('/api/events-list', async ({ request }) => {
      const body = (await request.json()) as { events: Event[] };
      const updatedEvents = body.events as Event[];

      let isUpdated = false;
      const newEvents = [...mockEvents];

      updatedEvents.forEach((event) => {
        const eventIndex = newEvents.findIndex((e) => e.id === event.id);

        if (eventIndex > -1) {
          isUpdated = true;
          newEvents[eventIndex] = { ...newEvents[eventIndex], ...event };
        }
      });

      if (isUpdated) {
        mockEvents = newEvents;
        return HttpResponse.json({ events: mockEvents });
      }
    })
  );
};

export const setupMockHandlerDeletion = () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      title: '삭제할 이벤트',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '삭제할 이벤트입니다',
      location: '어딘가',
      category: '기타',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
  ];

  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEvents });
    }),
    http.delete('/api/events/:id', ({ params }) => {
      const { id } = params;
      const index = mockEvents.findIndex((event) => event.id === id);

      mockEvents.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    })
  );
};

export const setupMockHandlerEventListDeletion = () => {
  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEventsData });
    }),
    http.delete('/api/events-list', async ({ request }) => {
      try {
        const body = (await request.json()) as { eventIds: string[] };

        if (!Array.isArray(body.eventIds)) {
          return HttpResponse.json({ error: 'eventIds가 배열이 아닙니다' }, { status: 400 });
        }

        const filtered = mockEventsData.filter((e) => !body.eventIds.includes(e.id));

        mockEventsData.length = 0;
        mockEventsData.push(...filtered);

        return new HttpResponse(null, { status: 204 });
      } catch (err) {
        console.error('❗ DELETE /api/events-list 에러:', err);
        return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
      }
    })
  );
};
