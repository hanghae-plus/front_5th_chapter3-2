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

      // 반복 이벤트인 경우
      if (newEvent.repeat?.type !== 'none') {
        const count = newEvent.repeat.endType === 'count' ? newEvent.repeat.endCount || 1 : 3; // 기본값 3으로 설정

        // count만큼 이벤트 생성
        for (let i = 0; i < count; i++) {
          const event = {
            ...newEvent,
            id: String(mockEvents.length + i + 1),
            date: new Date(
              new Date(newEvent.date).setDate(
                new Date(newEvent.date).getDate() + i * newEvent.repeat.interval
              )
            )
              .toISOString()
              .split('T')[0],
          };
          mockEvents.push(event);
        }
        return HttpResponse.json(mockEvents[mockEvents.length - 1], { status: 201 });
      }

      // 일반 이벤트인 경우
      newEvent.id = String(mockEvents.length + 1);
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
      repeat: { type: 'none', interval: 0, endType: 'none' },
      notificationTime: 10,
      isRecurring: undefined,
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
      repeat: { type: 'none', interval: 0, endType: 'none' },
      notificationTime: 5,
      isRecurring: undefined,
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
      repeat: { type: 'none', interval: 0, endType: 'none' },
      notificationTime: 10,
      isRecurring: undefined,
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

export const setupMockHandlerListCreation = (initEvents = [] as Event[]) => {
  const mockEvents: Event[] = [...initEvents];

  const getEventsHandler = http.get('/api/events', () => {
    return HttpResponse.json({ events: mockEvents });
  });

  const createEventListHandler = http.post('/api/events-list', async ({ request }) => {
    const { events: newEvents } = (await request.json()) as { events: Event[] };
    const repeatedEvents = newEvents.map((event, index) => ({
      ...event,
      id: `${mockEvents.length + index + 1}`,
    }));
    mockEvents.push(...repeatedEvents);
    return HttpResponse.json(repeatedEvents, { status: 201 });
  });

  server.use(getEventsHandler, createEventListHandler);
};
