import { useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Event, EventForm } from '../types';

export const useEventOperations = (editing: boolean, onSave?: () => void) => {
  const [events, setEvents] = useState<Event[]>([]);
  const toast = useToast();

  // 서버에서 일정 목록 불러오기
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

  // 일정 저장 (반복일정이면 여러 개 생성)
  const saveEvent = async (eventData: Event | EventForm) => {
    try {
      //  반복일정 처리
      if (!editing && eventData.repeat?.type !== 'none') {
        const repeatId = uuidv4(); // 동일 반복 일정 묶음 ID
        const start = new Date(eventData.date);
        const end = new Date(eventData.repeat.endDate || '2025-09-30');
        const interval = eventData.repeat.interval || 1;
        const type = eventData.repeat.type;

        const repeatedEvents: EventForm[] = [];
        let current = new Date(start);

        // 반복 조건에 따라 날짜 생성
        while (current <= end) {
          repeatedEvents.push({
            ...eventData,
            id: undefined,
            date: current.toISOString().split('T')[0],
            repeat: {
              ...eventData.repeat,
              id: repeatId,
            },
          });

          if (type === 'daily') {
            current.setDate(current.getDate() + interval);
          } else if (type === 'weekly') {
            current.setDate(current.getDate() + 7 * interval);
          } else if (type === 'monthly') {
            const month = current.getMonth() + interval;
            const year = current.getFullYear() + Math.floor(month / 12);
            const newMonth = month % 12;
            current = new Date(year, newMonth, Math.min(current.getDate(), 28)); // 28일까지만 안전
          } else if (type === 'yearly') {
            const year = current.getFullYear() + interval;
            try {
              current.setFullYear(year);
            } catch {
              current = new Date(year, current.getMonth(), 28); // 윤년 대응
            }
          }
        }

        // POST 요청으로 반복 일정 전체 생성
        const response = await fetch('/api/events-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: repeatedEvents }),
        });

        if (!response.ok) {
          throw new Error('반복 일정 저장 실패');
        }

        await fetchEvents();
        onSave?.();
        toast({
          title: '반복 일정이 추가되었습니다.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        return; // 단일 저장 로직 실행 안 하도록 종료
      }

      // 단일 일정 저장 (수정 or 단일 일정 추가)
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

  // 일정 삭제
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

  // 초기 데이터 로딩
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