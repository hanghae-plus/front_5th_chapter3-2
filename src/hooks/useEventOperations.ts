import { useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import { Event, EventForm } from '../types';

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

  const saveEvent = async (eventData: Event | EventForm, editingEvent: Event | null) => {
    try {
      let response;
      if (editing) {
        // PUT: 반복 이벤트 수정
        if (eventData.repeat.type !== 'none') {
          console.log('here');
          response = await updateRepeatedEvent(eventData, editingEvent as Event);
        } else {
          // PUT: 단일 이벤트 수정
          response = await fetch(`/api/events/${(eventData as Event).id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
          });
        }
      } else {
        // POST: 반복 이벤트 생성
        if (eventData.repeat.type !== 'none') {
          response = await fetch('/api/events-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events: [eventData] }),
          });
        } else {
          // POST: 단일 이벤트 생성
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

  const updateRepeatedEvent = async (
    changes: Partial<EventForm>,
    virtualInstance: Event
  ): Promise<Response> => {
    // 1. 원본 반복 이벤트 찾기
    const originalEvent = events.find((e) => e.repeat?.id === virtualInstance.repeat.id);
    if (!originalEvent) {
      throw new Error('원본 이벤트를 찾을 수 없습니다.');
    }

    // 2. 원본 이벤트 복제 및 예외 추가
    const updatedOriginalEvent = { ...originalEvent };

    if (!updatedOriginalEvent.repeat.exceptions) {
      updatedOriginalEvent.repeat.exceptions = [];
    }

    // 해당 날짜를 예외로 추가
    if (!updatedOriginalEvent.repeat.exceptions.includes(virtualInstance.date)) {
      updatedOriginalEvent.repeat.exceptions.push(virtualInstance.date);
    }

    // 3. 새 단일 이벤트 생성 (변경 사항 적용)
    const newSingleEvent = {
      ...virtualInstance,
      ...changes,
      repeat: {
        type: 'none', // 강제적으로 단일 이벤트로 저장
        interval: 1,
      },
    } satisfies EventForm;

    // 4. 원본 이벤트 업데이트 (예외 추가)
    const putResponse = await fetch(`/api/events/${originalEvent.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedOriginalEvent),
    });

    if (!putResponse.ok) {
      throw new Error('반복 일정 수정 실패');
    }

    // 5. 새 단일 이벤트 저장
    const postResponse = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSingleEvent),
    });

    if (!postResponse.ok) {
      throw new Error('단일 일정 저장 실패');
    }

    return postResponse; // 또는 두 응답을 결합한 객체를 반환
  };

  const deleteRepeatedEvent = async (event: Event) => {
    try {
      const originalEvent = events.find((e) => e.repeat?.id === event.repeat?.id);
      if (!originalEvent) {
        throw new Error('원본 이벤트를 찾을 수 없습니다.');
      }

      // 원본 이벤트 복제 및 예외 추가
      const updatedOriginalEvent = { ...originalEvent };

      if (!updatedOriginalEvent.repeat.exceptions) {
        updatedOriginalEvent.repeat.exceptions = [];
      }

      // 해당 날짜를 예외로 추가
      if (!updatedOriginalEvent.repeat.exceptions.includes(event.date)) {
        updatedOriginalEvent.repeat.exceptions.push(event.date);
      }

      // 원본 이벤트 업데이트 (예외 추가)
      const putResponse = await fetch(`/api/events/${originalEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOriginalEvent),
      });

      if (!putResponse.ok) {
        throw new Error('반복 일정 수정 삭제');
      }

      await fetchEvents();
      toast({
        title: '반복 일정이 삭제되었습니다.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('반복 일정 삭제 실패:', error);
      toast({
        title: '반복 일정 삭제 실패',
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

  return {
    events,
    fetchEvents,
    saveEvent,
    deleteEvent,
    updateRepeatedEvent,
    deleteRepeatedEvent,
  };
};
