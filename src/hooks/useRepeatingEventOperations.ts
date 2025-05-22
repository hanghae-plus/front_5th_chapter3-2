import { useToast } from '@chakra-ui/react';
import { useState } from 'react';

import { Event, EventForm, RepeatInfo } from '../types';
import { generateRepeatingEvents } from '../utils/repeatUtils';

const getUUID = () => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
};

export const useRepeatingEventOperations = (onSuccess?: () => void) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();

  const saveRepeatingEvents = async (
    baseEventForm: Omit<EventForm, 'repeat'>, // id는 서버에서 자동 생성, repeat는 여기서 구성
    repeatInfo: RepeatInfo
  ): Promise<Event[] | null> => {
    setIsLoading(true);
    setError(null);

    if (repeatInfo.type === 'none') {
      toast({
        title: '반복 유형이 "없음"으로 설정되어 있습니다.',
        description: '단일 일정 추가를 이용해주세요.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return null;
    }

    if (!repeatInfo.endDate) {
      toast({
        title: '반복 일정은 종료일이 필수입니다.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return null;
    }

    const repeatGroupId = getUUID();
    const eventsToCreateWithFullRepeatInfo: Event[] = generateRepeatingEvents(
      baseEventForm, // Omit<Event, 'id' | 'repeat'> 타입과 호환되어야 함
      { ...repeatInfo, id: repeatGroupId }, // generateRepeatingEvents 내부에서 이 id를 사용하지 않음
      repeatGroupId
    );

    // generateRepeatingEvents는 각 Event에 id를 생성해서 넣어줍니다.
    // API /api/events-list는 페이로드로 받은 events 배열의 각 event에 대해 id를 새로 부여합니다.
    // 따라서 클라이언트에서 생성한 id는 서버에서 덮어씌워지거나 무시될 수 있습니다.
    // 여기서는 generateRepeatingEvents가 생성한 id를 그대로 사용하되,
    // API 스펙에 따라 페이로드에서 id를 제외해야 할 수도 있습니다.
    // 현재 server.js는 클라이언트 ID 유무와 관계없이 새 ID를 부여합니다.

    if (eventsToCreateWithFullRepeatInfo.length === 0) {
      toast({
        title: '생성할 반복 일정이 없습니다.',
        description: '반복 설정 및 종료일을 확인해주세요.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return null;
    }

    // API에 전송할 때는 EventForm[] 형태로 보낼 수 있으나,
    // generateRepeatingEvents는 Event[] (id 포함)를 반환합니다.
    // 서버의 /api/events-list 핸들러는 요청 본문에서 events 배열을 받아 각 요소에 id를 새로 부여합니다.
    // 따라서 EventForm에서 id가 없는 Omit<Event, 'id'> 형태로 보내는 것이 더 명확할 수 있습니다.
    const payloadEvents = eventsToCreateWithFullRepeatInfo.map((event) => {
      const { ...eventData } = event;
      return {
        ...eventData,
        repeat: {
          // 서버에서 repeat.id를 채워줄 것이므로, 여기서는 type, interval, endDate만 보낼 수도 있음
          type: event.repeat.type,
          interval: event.repeat.interval,
          endDate: event.repeat.endDate,
          maxOccurrences: event.repeat.maxOccurrences,
          id: repeatGroupId,
        },
      };
    });

    try {
      const response = await fetch('/api/events-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 서버는 events 배열을 받음
        body: JSON.stringify({ events: payloadEvents }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to save repeating events' }));
        throw new Error(errorData.message || 'Failed to save repeating events');
      }

      const savedEvents = (await response.json()) as Event[]; // 서버가 반환하는 Event[] 타입

      toast({
        title: '반복 일정이 추가되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onSuccess?.();
      return savedEvents;
    } catch (err) {
      console.error('Error saving repeating events:', err);
      setError(err as Error);
      toast({
        title: '반복 일정 저장 실패',
        description: (err as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { saveRepeatingEvents, isLoading, error };
};
