import { useToast } from '@chakra-ui/react';

import { Event, EventForm } from '../types';
import { createRepeatingEvents } from '../utils/repeatUtils';

/**
 * 반복 일정을 처리하는 서비스 훅
 * 기존 useEventOperations 훅과 분리하여 반복 일정 로직을 독립적으로 처리.
 */
export const useEventRepeat = () => {
  const toast = useToast();

  /**
   * 반복 일정을 생성하는 함수
   * 반복 없는 일정은 단일 이벤트만 생성, 반복 있는 일정은 여러 이벤트를 생성
   * @param eventData - 이벤트 데이터
   * @returns boolean - 이벤트 생성 성공 여부
   */
  const createRepeatEvents = async (eventData: EventForm): Promise<boolean> => {
    try {
      if (eventData.repeat.type === 'none') {
        // 반복 없는 일반 이벤트는 단일 이벤트만 생성
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          throw new Error('단일 이벤트 저장 실패');
        }
      } else {
        // 반복 일정은 여러 이벤트 생성
        const repeatingEvents = createRepeatingEvents(eventData);

        // 모든 반복 이벤트 저장
        for (const repeatEvent of repeatingEvents) {
          const response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(repeatEvent),
          });

          if (!response.ok) {
            throw new Error('반복 이벤트 저장 실패');
          }
        }
      }

      toast({
        title: '일정이 추가되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return true;
    } catch (error) {
      console.error('Error saving events:', error);
      toast({
        title: '일정 저장 실패',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });

      return false;
    }
  };

  /**
   * 반복 일정 중 단일 일정만 수정하는 함수
   * 반복 속성을 'none'으로 변경하여 단일 일정으로 만듦
   * @param eventData - 이벤트 데이터
   * @returns boolean - 이벤트 수정 성공 여부
   */
  const updateSingleEvent = async (eventData: Event): Promise<boolean> => {
    try {
      // 반복 타입을 'none'으로 변경하여 단일 일정으로 변환
      const modifiedEventData = {
        ...eventData,
        repeat: { ...eventData.repeat, type: 'none' },
      };

      const response = await fetch(`/api/events/${eventData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modifiedEventData),
      });

      if (!response.ok) {
        throw new Error('일정 수정 실패');
      }

      toast({
        title: '일정이 수정되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: '일정 수정 실패',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });

      return false;
    }
  };

  /**
   * 반복 일정 중 단일 일정만 삭제하는 함수
   * @param eventId - 이벤트 ID
   * @returns boolean - 이벤트 삭제 성공 여부
   */
  const deleteSingleEvent = async (eventId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('일정 삭제 실패');
      }

      toast({
        title: '일정이 삭제되었습니다.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: '일정 삭제 실패',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });

      return false;
    }
  };

  return {
    createRepeatEvents,
    updateSingleEvent,
    deleteSingleEvent,
  };
};
