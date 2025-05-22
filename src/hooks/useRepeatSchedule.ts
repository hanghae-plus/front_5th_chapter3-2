import { useToast } from '@chakra-ui/react';
import { useCallback } from 'react';

import { EventForm, RepeatType } from '../types';
import { generateRepeatedEvents } from '../utils/generateRepeatedEvents';

export const useRepeatSchedule = (onSuccess?: () => void) => {
  const toast = useToast();

  const saveRepeatingSchedule = useCallback(
    async (
      baseEvent: Omit<EventForm, 'repeat'>,
      repeat: {
        type: RepeatType;
        interval: number;
        endDate: string;
        count?: number;
      }
    ) => {
      try {
        const eventWithRepeat: EventForm = {
          ...baseEvent,
          repeat,
        };
        const events = generateRepeatedEvents(eventWithRepeat);

        const response = await fetch('/api/events-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events }),
        });

        if (!response.ok) {
          throw new Error('Failed to save repeating events');
        }

        onSuccess?.();
        toast({
          title: '반복 일정이 생성되었습니다.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error saving repeating events:', error);
        toast({
          title: '반복 일정 저장 실패',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [onSuccess, toast]
  );

  return { saveRepeatingSchedule };
};
