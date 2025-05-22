import { useToast } from '@chakra-ui/react';
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  format,
  getDate,
  getDaysInMonth,
  endOfDay,
} from 'date-fns';
import { useEffect, useState } from 'react';

import { Event, EventForm, RepeatType } from '../types';

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

  function preserveEndOfMonth(date: Date, interval: number, type: 'monthly' | 'yearly') {
    const isEndOfMonth = getDate(date) === getDaysInMonth(date);
    const baseFn = type === 'monthly' ? addMonths : addYears;
    const next = baseFn(date, interval);
    return isEndOfMonth ? new Date(next.getFullYear(), next.getMonth() + 1, 0) : next;
  }

  const addFnMap: Record<Exclude<RepeatType, 'none'>, (date: Date, interval: number) => Date> = {
    daily: addDays,
    weekly: addWeeks,
    monthly: addMonths,
    yearly: addYears,
  };

  const saveRepeatEvent = async (eventData: Event | EventForm) => {
    try {
      const { repeat, date, ...rest } = eventData;
      const { type, interval, endDate } = repeat;

      if (type === 'none') {
        // 반복 없는 일정은 단건 저장
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });
        return;
      }

      const addFn =
        type === 'monthly' || type === 'yearly'
          ? (date: Date, interval: number) => preserveEndOfMonth(date, interval, type)
          : addFnMap[type];
      const startDate = new Date(date);
      const end = endDate ? endOfDay(new Date(endDate)) : null;

      const formattedDates: string[] = [];
      let current = startDate;

      while (!end || current <= end) {
        formattedDates.push(format(current, 'yyyy-MM-dd'));
        current = addFn(current, interval);
        if (!end && formattedDates.length >= 100) break; // 무한루프 방지 (fallback)
      }

      for (const d of formattedDates) {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...rest,
            date: d,
            repeat: {
              type: 'none',
              interval: 1,
            },
          }),
        });
      }
    } catch (error) {
      console.error('Error saving repeat event:', error);
      toast({
        title: '반복 일정 저장 실패',
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

  return { events, fetchEvents, saveEvent, deleteEvent, saveRepeatEvent };
};
