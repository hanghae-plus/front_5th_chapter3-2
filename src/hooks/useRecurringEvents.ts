import { Event, EventForm } from '../types';
import { findOverlappingEvents } from '../utils/eventOverlap';
import { generateRecurringEvents } from '../utils/repeatEventUtils';

interface UseRecurringEventsProps {
  events: Event[];
  // eslint-disable-next-line no-unused-vars
  saveEvent: (event: Event) => Promise<void>;
  resetForm: () => void;
  // eslint-disable-next-line no-unused-vars
  setOverlappingEvents: (events: Event[]) => void;
  // eslint-disable-next-line no-unused-vars
  setIsOverlapDialogOpen: (isOpen: boolean) => void;
}

export function useRecurringEvents({
  events,
  saveEvent,
  resetForm,
  setOverlappingEvents,
  setIsOverlapDialogOpen,
}: UseRecurringEventsProps) {
  const saveRecurringEvents = async (eventData: Event | EventForm) => {
    const eventsToSave = generateRecurringEvents({
      ...eventData,
    });

    const overlapping = findOverlappingEvents(eventsToSave[0], events);

    if (overlapping.length > 0) {
      setOverlappingEvents(overlapping);
      setIsOverlapDialogOpen(true);
      return false;
    }

    for (const ev of eventsToSave) {
      await saveEvent(ev);
    }
    resetForm();
    return true;
  };

  return { saveRecurringEvents };
}
