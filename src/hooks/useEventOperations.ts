import { useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import { Event, EventForm } from '../types';
import { createRepeatedEvents, getAllRepeatedEventsIds } from '../utils/eventUtils';

export const useEventOperations = (editing: boolean, onSave?: () => void) => {
  const [events, setEvents] = useState<Event[]>([]);
  const toast = useToast();

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const { events } = await response.json();
      setEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: '이벤트 로딩 실패',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const saveEvent = async (eventData: Event | EventForm) => {
    try {
      let response;
      if (editing) {
        response = await fetch(`/api/events/${(eventData as Event).id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });
      } else {
        response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save event');
      }

      await fetchEvents();
      onSave?.();
      toast({
        title: editing ? '일정이 수정되었습니다.' : '일정이 추가되었습니다.',
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
      const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      await fetchEvents();
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

  const saveRepeatedEvents = async (eventData: EventForm, maxCount?: number) => {
    try {
      const newEvents = createRepeatedEvents(eventData as Event, maxCount);
      const response = await fetch('/api/events-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: newEvents }),
      });

      if (!response.ok) {
        throw new Error('반복 일정 저장 실패');
      }

      await fetchEvents();
      onSave?.();
      toast({
        title: '반복 일정이 저장되었습니다.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving repeated events:', error);
      toast({
        title: '반복 일정 저장 실패',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      await fetchEvents();
    }
  };

  const deleteAllRepeatedEvents = async (repeatId: string) => {
    try {
      await fetchEvents();
      const repeatedEventsIds = getAllRepeatedEventsIds(repeatId, events);
      const response = await fetch('/api/events-list', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds: repeatedEventsIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete all repeated events');
      }

      await fetchEvents();
      onSave?.();
      toast({
        title: '반복 일정이 모두 삭제되었습니다.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting all repeated events:', error);
      toast({
        title: '반복 일정 모두 삭제 실패',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      await fetchEvents();
    }
  };

  const deleteAllEvents = async () => {
    try {
      await fetchEvents();
      const eventIds = events.map((event: { id: string }) => event.id);

      const response = await fetch('/api/events-list', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete all events');
      }

      await fetchEvents();
      toast({
        title: '일정이 모두 삭제되었습니다.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting all events:', error);
      toast({
        title: '일정 모두 삭제 실패',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      await fetchEvents();
    }
  };

  async function init() {
    await fetchEvents();
    toast({
      title: '일정 로딩 완료!',
      status: 'info',
      duration: 1000,
    });
  }

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    events,
    fetchEvents,
    saveEvent,
    deleteEvent,
    saveRepeatedEvents,
    deleteAllRepeatedEvents,
    deleteAllEvents,
  };
};
