import { useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import { Event, EventForm, RepeatType } from '../types';
import {
  generateDailyDates,
  generateMonthlyDates,
  generateWeeklyDates,
  generateYearlyDates,
} from '../utils/repeatUtils.ts';

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

  //---- 반복 일정 API 메서드 추가-----
  const createRepeatEvent = async (eventForms: EventForm[]) => {
    // 1) repeatUtils 에서 날짜 배열을 생성
    const expanded: EventForm[] = eventForms.flatMap((form) => {
      switch (form.repeat.type as RepeatType) {
        case 'daily':
          return generateDailyDates(form as Event).map((date) => ({ ...form, date }));
        case 'weekly':
          return generateWeeklyDates(form as Event).map((date) => ({ ...form, date }));
        case 'monthly':
          return generateMonthlyDates(form as Event).map((date) => ({ ...form, date }));
        case 'yearly':
          return generateYearlyDates(form as Event).map((date) => ({ ...form, date }));
        default:
          return [form];
      }
    });

    // 2) 한 번의 API 호출로 확장된 일정을 전송
    try {
      const res = await fetch('/api/events-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: expanded }),
      });
      if (!res.ok) throw new Error();
      await fetchEvents();
      toast({ title: '반복 일정이 생성되었습니다.', status: 'success' });
    } catch {
      toast({ title: '반복 일정 생성 실패', status: 'error' });
    }
  };

  const updateRepeatEvents = async (eventForms: Event[]) => {
    try {
      const res = await fetch('/api/events-list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventForms }),
      });
      if (!res.ok) throw new Error('Failed to update recurring events');
      await fetchEvents();
      onSave?.();
      toast({
        title: '반복 일정이 수정되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({ title: '반복 일정 수정 실패', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const deleteRepeatEvents = async (eventIds: string[]) => {
    try {
      const res = await fetch('/api/events-list', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds }),
      });
      if (!res.ok) throw new Error('Failed to delete recurring events');
      await fetchEvents();
      toast({
        title: '반복 일정이 삭제되었습니다.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({ title: '반복 일정 삭제 실패', status: 'error', duration: 3000, isClosable: true });
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
    createRepeatEvent,
    updateRepeatEvents,
    deleteRepeatEvents,
  };
};
