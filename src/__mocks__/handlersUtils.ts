import { randomUUID } from 'crypto';

import { http, HttpResponse } from 'msw';

import { server } from '@/setupTests';
import { Event } from '@/types';

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

export const setupMockHandlerList = (initEvents = [] as Event[]) => {
  let mockEvents: Event[] = [...initEvents];

  server.use(
    http.get('/api/events', () => HttpResponse.json({ events: mockEvents })),
    http.post('/api/events', async ({ request }) => {
      const newEvent = (await request.json()) as Event;
      newEvent.id = String(mockEvents.length + 1); // 간단한 ID 생성
      mockEvents.push(newEvent);
      return HttpResponse.json(newEvent, { status: 201 });
    }),
    // server.js에 추가된 API 목록

    // POST /api/events-list
    // PUT /api/events-list
    // DELETE /api/events-list
    http.post('/api/events-list', async ({ request }) => {
      const { events: newEvents } = (await request.json()) as { events: Event[] };

      newEvents.forEach((_, index) => {
        newEvents[index].id = randomUUID();
      });

      mockEvents.push(...newEvents);
      return HttpResponse.json(newEvents, { status: 201 });
    }),

    // 동작을 제대로 하지 않는 것 같다..
    http.put('/api/events-list', async ({ request }) => {
      let isUpdated = false;
      const newEvents = [...mockEvents];

      const { events: updatedEvents } = (await request.json()) as { events: Event[] };

      updatedEvents.forEach((event) => {
        const index = mockEvents.findIndex((target) => target.id === event.id);
        if (index > -1) {
          isUpdated = true;
          newEvents[index] = { ...mockEvents[index], ...event };
          mockEvents[index] = { ...newEvents[index] };
        }
      });
      mockEvents = [...newEvents];

      if (isUpdated) return HttpResponse.json(newEvents);
      return new HttpResponse(null, { status: 404 });
    }),
    http.delete('/api/events-list', async ({ request }) => {
      const { eventIds } = (await request.json()) as { eventIds: Event['id'][] };

      const newEvents = mockEvents.filter((event) => !eventIds.includes(event.id));

      mockEvents = [...newEvents];

      if (newEvents.length !== mockEvents.length) return new HttpResponse(null, { status: 204 });
      return new HttpResponse(null, { status: 404 });
    })
  );
};
