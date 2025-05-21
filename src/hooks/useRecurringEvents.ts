import { useMemo } from 'react';

import { Event } from '../types';
import { generateRecurringEvents } from '../utils/repeatEventUtils';

export function useRecurringEvents(events: Event[]) {
  return useMemo(() => {
    return events.flatMap((event) => {
      if (event.repeat.type !== 'none') {
        const recurringEvents = generateRecurringEvents(event);
        return recurringEvents.map((e) => ({
          ...e,
          isRecurring: true,
          id: e.id.toString(),
        }));
      }
      return [
        {
          ...event,
          isRecurring: false,
          id: event.id.toString(),
        },
      ];
    });
  }, [events]);
}
