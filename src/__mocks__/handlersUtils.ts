import { http, HttpResponse } from 'msw';

import { server } from '../setupTests';
import { Event, RepeatType } from '../types';

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
      const newEvent = (await request.json()) as Event;
      newEvent.id = String(mockEvents.length + 1);
      if (newEvent.repeat.type !== 'none') {
        newEvent.repeat.id = String(mockEvents.length + 1);
      }

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

/**
 *
 * export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
 */

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

/**
 * export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
 */

export const setupMockHandlerRepeat = ({ repeatType }: { repeatType: RepeatType }) => {
  const mockEvents: Event[] = [
    {
      id: '1',
      title: '반복 일정 회의1',
      date: '2025-05-19',
      startTime: '09:00',
      endTime: '10:00',
      description: '반복 일정 테스트',
      location: '회의실 B',
      category: '업무',
      repeat: { id: '1', type: repeatType, interval: 1 },
      notificationTime: 10,
    },
    {
      id: '2',
      title: '반복 일정 회의2',
      date: '2025-05-20',
      startTime: '09:00',
      endTime: '10:00',
      description: '반복 일정 테스트',
      location: '회의실 B',
      category: '업무',
      repeat: { id: '1', type: repeatType, interval: 1 },
      notificationTime: 10,
    },
    {
      id: '3',
      title: '반복 일정 회의3',
      date: '2025-05-21',
      startTime: '09:00',
      endTime: '10:00',
      description: '반복 일정 테스트',
      location: '회의실 B',
      category: '업무',
      repeat: { id: '1', type: repeatType, interval: 1 },
      notificationTime: 10,
    },
  ];

  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEvents });
    }),

    http.put('/api/events-list', async ({ request }) => {
      const { events: eventsToUpdate } = (await request.json()) as { events: Event[] };
      let isUpdated = false;

      const newEvents = [...mockEvents];
      eventsToUpdate.forEach((event) => {
        const eventIndex = mockEvents.findIndex((target) => target.id === event.id);
        if (eventIndex > -1) {
          isUpdated = true;
          newEvents[eventIndex] = { ...mockEvents[eventIndex], ...event };
        }
      });

      if (isUpdated) {
        // mockEvents 배열 업데이트
        mockEvents.length = 0;
        mockEvents.push(...newEvents);
        return HttpResponse.json({ events: mockEvents });
      }

      return new HttpResponse(null, { status: 404 });
    })
  );
};
