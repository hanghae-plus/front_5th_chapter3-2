import { http, HttpResponse } from 'msw';

import { server } from '../setupTests';
import { Event } from '../types';

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
    }),
    http.post('/api/events-list', async ({ request }) => {
      const { events: newEvents } = (await request.json()) as { events: Event[] };
      const repeatedEvents = newEvents.map((event, index) => ({
        ...event,
        id: String(mockEvents.length + index + 1),
      }));
      mockEvents.push(...repeatedEvents);
      return HttpResponse.json(repeatedEvents, { status: 201 });
    }),
    http.delete('/api/events/:id', ({ params }) => {
      const { id } = params;
      const index = mockEvents.findIndex((event) => event.id === id);

      mockEvents.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    }),
    http.put('/api/events/:id', async ({ params, request }) => {
      const { id } = params;
      const updatedEvent = (await request.json()) as Event;
      const index = mockEvents.findIndex((event) => event.id === id);
      mockEvents[index] = { ...mockEvents[index], ...updatedEvent };
      return HttpResponse.json(mockEvents[index]);
    }),
    http.put('/api/events-list', async ({ request }) => {
      const { events } = (await request.json()) as { events: Event[] };
      events.forEach((event) => {
        const index = mockEvents.findIndex((e) => e.id === event.id);
        mockEvents[index] = { ...mockEvents[index], ...event };
      });
      return HttpResponse.json(events, { status: 200 });
    })
  );
};

export const setupMockHandlerDeletionAllRepeatEvents = () => {
  let mockEvents: Event[] = [
    {
      id: '1',
      title: '기존 회의',
      date: '2025-10-20',
      startTime: '09:00',
      endTime: '10:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { id: 'repeat-id', type: 'weekly', interval: 1, 'endDate': '2025-10-30'},
      notificationTime: 10,
    },
    {
      id: '2',
      title: '기존 회의',
      date: '2025-10-27',
      startTime: '09:00',
      endTime: '10:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { id: 'repeat-id', type: 'daily', interval: 1, 'endDate': '2025-10-30'},
      notificationTime: 10,
    },
  ];

  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEvents });
    }),
    http.delete('/api/events-list', async ({ request }) => {
      const { eventIds } = (await request.json()) as { eventIds: string[] };

      const newEvents = mockEvents.filter((event) => !eventIds.includes(event.id));
      mockEvents = [...newEvents];

      return new HttpResponse(null, { status: 204 });
    })
  );
};

export const setupMockHandlerUpdatingAllRepeatEvents = () => {
  let mockEvents: Event[] = [
    {
      id: '1',
      title: '기존 회의',
      date: '2025-10-20',
      startTime: '09:00',
      endTime: '10:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { id: 'repeat-id', type: 'weekly', interval: 1, 'endDate': '2025-10-30'},
      notificationTime: 10,
    },
    {
      id: '2',
      title: '기존 회의',
      date: '2025-10-27',
      startTime: '09:00',
      endTime: '10:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { id: 'repeat-id', type: 'daily', interval: 1, 'endDate': '2025-10-30'},
      notificationTime: 10,
    },
  ];

  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEvents });
    }),
    http.put('/api/events-list', async ({ request }) => {
      const { events } = (await request.json()) as { events: Event[] };

      events.forEach((event) => {
        const index = mockEvents.findIndex((e) => e.id === event.id);
        mockEvents[index] = { ...mockEvents[index], ...event };
      });

      return HttpResponse.json(events, { status: 200 });
    })
  );
};