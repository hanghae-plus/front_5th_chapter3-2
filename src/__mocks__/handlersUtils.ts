import { http, HttpResponse } from 'msw';
import { v4 as uuidv4 } from 'uuid';

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

export const setupMockHandlerRepeatCreation = (initEvents = [] as Event[]) => {
  const mockEvents: Event[] = [...initEvents];

  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEvents });
    }),
    http.post('/api/events-list', async ({ request }) => {
      const event = (await request.json()) as Event;

      const repeatId = uuidv4();
      const newEvents = expandRepeatingEvent(event, repeatId);

      console.log('생성된 반복 일정 in setupMockHandlerRepeatCreation:', newEvents);
      mockEvents.push(...newEvents);

      return HttpResponse.json(newEvents, { status: 201 });
    })
  );
};

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function expandRepeatingEvent(event: Event, repeatId: string): Event[] {
  const result: Event[] = [];

  const repeat = event.repeat;
  if (!repeat || repeat.type === 'none') return [{ ...event, id: uuidv4() }];

  const interval = repeat.interval || 1;
  const startDate = new Date(event.date);
  const endDate = new Date(repeat.endDate!);
  const originalDay = startDate.getDate();

  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    let adjustedDate = new Date(currentDate);

    // ✅ 윤년 처리 (2월 29일 → 2월 28일)
    if (
      repeat.type === 'yearly' &&
      startDate.getMonth() === 1 &&
      startDate.getDate() === 29 &&
      !isLeapYear(currentDate.getFullYear())
    ) {
      adjustedDate = new Date(currentDate.getFullYear(), 1, 28);
    }

    // ✅ 31일 → 존재하지 않는 달의 마지막 날짜로 보정
    if (repeat.type === 'monthly' || repeat.type === 'yearly') {
      const daysInMonth = new Date(
        adjustedDate.getFullYear(),
        adjustedDate.getMonth() + 1,
        0
      ).getDate();
      const correctedDay = Math.min(originalDay, daysInMonth);
      adjustedDate = new Date(adjustedDate.getFullYear(), adjustedDate.getMonth(), correctedDay);
    }

    result.push({
      ...event,
      id: uuidv4(),
      date: toISODateString(adjustedDate),
      repeat: {
        ...repeat,
        id: repeatId,
      },
    });

    // 🔁 다음 반복 날짜 계산
    const temp = new Date(currentDate); // backup

    switch (repeat.type) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7 * interval);
        break;
      case 'monthly':
        currentDate = new Date(temp); // 원래 날짜 기준
        currentDate.setDate(1); // overflow 방지
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + interval);
        break;
    }
  }

  return result;
}
