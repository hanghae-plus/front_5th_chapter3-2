import { Event, EventForm } from '../types';
import { createRepeatEvents } from '../utils/createRepeatEvents';
import { isRepeating, type SaveEventData } from '../utils/eventValidation';

export const createEvent = async (eventData: Event | EventForm) => {
  if (isRepeating(eventData)) {
    const repeatEvents = createRepeatEvents(eventData as Event);
    await fetch('/api/events-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: repeatEvents }),
    });
    return;
  }

  await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });
};

export const updateEvent = async (eventData: SaveEventData, isRepeat: boolean) => {
  // 반복 일정 여부에 따라 전달할 데이터 형식 변경
  const data = isRepeat
    ? {
        ...eventData,
        repeat: { type: 'none', interval: 0 },
      }
    : eventData;

  const response = await fetch(`/api/events/${(eventData as Event).id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update event');
  }
};
