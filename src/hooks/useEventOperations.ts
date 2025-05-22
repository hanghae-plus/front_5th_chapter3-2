import { useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import { Event, EventForm } from '../types';
import { formatDate } from '../utils/dateUtils';

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

  // TODO - 반복 일정 로직 처리
  const saveEvent = async (eventData: Event | EventForm) => {
    console.log('타입', eventData.repeat.type);
    try {
      let response;
      if (editing) {
        response = await fetch(`/api/events/${(eventData as Event).id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });
      } else {
        if (eventData.repeat.type !== 'none' && eventData.repeat.endDate) {
          //repeat data
          const repeatType = eventData.repeat.type;

          let currentDate = new Date(eventData.date);
          const endDate = new Date(eventData.repeat.endDate);
          const repeatInterval = eventData.repeat.interval;
          const newEvents: EventForm[] = [];
          newEvents.push({ ...eventData });

          while (currentDate < endDate) {
            if (repeatType === 'daily') {
              currentDate.setDate(currentDate.getDate() + 1 * repeatInterval);
            }
            if (repeatType === 'weekly') {
              currentDate.setDate(currentDate.getDate() + 7 * repeatInterval);
            }
            if (repeatType === 'monthly') {
              currentDate.setMonth(currentDate.getMonth() + 1 * repeatInterval);
            }
            if (repeatType === 'yearly') {
              currentDate.setFullYear(currentDate.getFullYear() + 1 * repeatInterval);
            }

            newEvents.push({ ...eventData, date: formatDate(currentDate) });
          }

          //반복 일정 포함된 데이터

          //post
          response = await fetch('/api/events-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events: newEvents }),
          });
        } else {
          response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
          });
        }
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

  return { events, fetchEvents, saveEvent, deleteEvent };
};
