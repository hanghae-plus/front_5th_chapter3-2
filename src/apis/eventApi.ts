import { Event, EventForm } from '../types';

// 단일 이벤트 생성
export async function createEvent(event: EventForm): Promise<Event> {
  const response = await fetch('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error('이벤트 생성에 실패했습니다.');
  }

  return response.json();
}

// 이벤트 수정
export async function updateEvent(event: Event): Promise<Event> {
  const response = await fetch(`/api/events/${event.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error('이벤트 수정에 실패했습니다.');
  }

  return response.json();
}

// 이벤트 삭제
export async function deleteEvent(id: string): Promise<void> {
  const response = await fetch(`/api/events/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('이벤트 삭제에 실패했습니다.');
  }
}

// 모든 이벤트 조회
export async function getAllEvents(): Promise<Event[]> {
  const response = await fetch('/api/events');

  if (!response.ok) {
    throw new Error('이벤트 조회에 실패했습니다.');
  }

  const data = await response.json();
  return data.events;
}

// 반복 이벤트 리스트 생성
export async function createEventsList(data: { events: (Event | EventForm)[] }): Promise<Event[]> {
  const response = await fetch('/api/events-list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('반복 이벤트 생성에 실패했습니다.');
  }

  return response.json();
}

// 반복 이벤트 리스트 수정
export async function updateEventsList(data: { events: Event[] }): Promise<Event[]> {
  const response = await fetch('/api/events-list', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('반복 이벤트 수정에 실패했습니다.');
  }

  return response.json();
}

// 반복 이벤트 리스트 삭제
export async function deleteEventsList(data: { eventIds: string[] }): Promise<void> {
  const response = await fetch('/api/events-list', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('반복 이벤트 삭제에 실패했습니다.');
  }
}
