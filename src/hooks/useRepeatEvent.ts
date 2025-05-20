import { useState } from 'react';

import { EventForm, Event } from '../types';
import { createRepeatEvents } from '../utils/repeatEvent';

export const useRepeatEvent = () => {
  const [events, setEvents] = useState<Event[]>([]);

  const createRepeatEvent = (event: EventForm) => {
    const repeatEvents = createRepeatEvents(event).map((event) => ({
      ...event,
      id: crypto.randomUUID(),
    }));
    setEvents(repeatEvents);
  };

  const updateRepeatEvent = (updatedEvent: Event) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
    );
  };

  const deleteRepeatEvent = (eventId: string) => {
    setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId));
  };

  return {
    events,
    createRepeatEvent,
    updateRepeatEvent,
    deleteRepeatEvent,
  };
};
