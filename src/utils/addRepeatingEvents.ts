import { Event, EventForm } from '../types';
import { getRepeatingEvents } from './getRepeatingEvents';

export const addRepeatingEvents = async (event: Event | EventForm): Promise<Response> => {
  const result = getRepeatingEvents(event);

  if (!result.length) return new Response(null, { status: 204 });

  const response = await fetch('/api/events-list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events: result }),
  });

  return response;
};
