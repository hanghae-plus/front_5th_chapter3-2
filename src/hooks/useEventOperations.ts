import { useToast } from '@chakra-ui/react';

import { useEvents } from '../contexts/EventContext';
import { useEventFormContext } from '../contexts/EventFormContext';
import { Event, EventForm } from '../types';
import {
  checkEventIsRecurring,
  createRecurringEvents,
  getRecurringEventIdsForDelete,
  updateRecurringEvents,
} from '../utils/recurringEventUtils';

const BASE_URL = (isRepeating: boolean) => (isRepeating ? '/api/events-list' : '/api/events');

export const useEventOperations = (isEditing?: boolean) => {
  const { editingEvent, setEditingEvent, isRepeating } = useEventFormContext();
  const { events, revalidateEvents } = useEvents();

  const toast = useToast();

  const editing = Boolean(editingEvent) || isEditing;

  const saveNonRecurringEvent = async (eventData: Event | EventForm) => {
    let response;

    if (editing) {
      response = await fetch(`${BASE_URL(isRepeating)}/${(eventData as Event).id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
    } else {
      response = await fetch(BASE_URL(isRepeating), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
    }

    if (!response.ok) throw new Error('Failed to save non-recurring event');
  };

  const saveRecurringEvents = async (eventData: Event | EventForm) => {
    let response;

    if (editing) {
      const newRecurringEvents = createRecurringEvents(eventData as Event);
      const updatedRecurringEvents = updateRecurringEvents(
        eventData as Event,
        events,
        newRecurringEvents as Event[]
      );

      response = await fetch(BASE_URL(isRepeating), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: updatedRecurringEvents }),
      });
    } else {
      const newRecurringEvents = createRecurringEvents(eventData as Event);

      response = await fetch(BASE_URL(isRepeating), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: newRecurringEvents }),
      });
    }

    if (!response.ok) throw new Error('Failed to save recurring event');
  };

  const saveEvent = async (eventData: Event | EventForm) => {
    try {
      isRepeating ? await saveRecurringEvents(eventData) : await saveNonRecurringEvent(eventData);

      await revalidateEvents();
      setEditingEvent(null);
      toast({
        title: isEditing ? '일정이 수정되었습니다.' : '일정이 추가되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: '일정 저장 실패',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      let response;
      const isEventRecurring = checkEventIsRecurring(id, events);

      if (isEventRecurring) {
        const eventIdsForDelete = getRecurringEventIdsForDelete(id, events);

        response = await fetch(`${BASE_URL(isEventRecurring)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventIds: eventIdsForDelete }),
        });
      } else {
        response = await fetch(`${BASE_URL(isEventRecurring)}/${id}`, {
          method: 'DELETE',
        });
      }

      if (!response.ok) throw new Error('Failed to delete event');

      await revalidateEvents();
      toast({
        title: '일정이 삭제되었습니다.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: '일정 삭제 실패',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return { saveEvent, deleteEvent };
};
