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
      title: '기존 회의1',
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

export const setupMockHandlerRepeatedEventCreation = (initEvents = [] as Event[]) => {
  const mockEvents: Event[] = [...initEvents];

  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEvents });
    }),
    http.post('/api/events-list', async ({ request }) => {
      const { events: newEvents } = (await request.json()) as { events: Event[] };
      const repeatedEvents = newEvents.map((event, index) => ({
        ...event,
        id: `${mockEvents.length + index + 1}`,
      }));
      mockEvents.push(...repeatedEvents);
      return HttpResponse.json(repeatedEvents, { status: 201 });
    })
  );
};

export const setupMockHandlerRepeatedEventUpdating = () => {
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
    http.put('/api/events-list', async ({ request }) => {
      const { events: newEvents } = (await request.json()) as { events: Event[] };
      newEvents.forEach((event) => {
        const eventIndex = mockEvents.findIndex((target) => target.id === event.id);
        if (eventIndex > -1) {
          mockEvents[eventIndex] = { ...mockEvents[eventIndex], ...event };
        }
      });

      return HttpResponse.json(mockEvents);
    })
  );
};

export const setupMockHandlerRepeatedEventDeletion = () => {
  let mockEvents: Event[] = [
    {
      id: '1',
      title: '삭제 대상',
      date: '2025-07-07',
      startTime: '14:00',
      endTime: '15:00',
      description: '삭제될 회의',
      location: '회의실 X',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-07-21', id: 'repeat-id' },
      notificationTime: 10,
    },
    {
      id: '2',
      title: '삭제 대상',
      date: '2025-07-14',
      startTime: '14:00',
      endTime: '15:00',
      description: '삭제될 회의',
      location: '회의실 X',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-07-21', id: 'repeat-id' },
      notificationTime: 10,
    },
    {
      id: '3',
      title: '삭제 대상',
      date: '2025-07-21',
      startTime: '14:00',
      endTime: '15:00',
      description: '삭제될 회의',
      location: '회의실 X',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-07-21', id: 'repeat-id' },
      notificationTime: 10,
    },
    {
      id: '4',
      title: '유지될 회의',
      date: '2025-07-07',
      startTime: '16:00',
      endTime: '17:00',
      description: '다른 용무',
      location: '개인실',
      category: '개인',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 5,
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
