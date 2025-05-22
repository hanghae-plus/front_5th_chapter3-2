import { Event, EventForm, RepeatType } from '../types';
import { findOverlappingEvents } from '../utils/eventOverlap';
import { generateRepeatDates } from '../utils/repeatUtils';

interface UseRecurringEventsProps {
  events: Event[];
  saveEvent: (event: Event) => Promise<void>;
  resetForm: () => void;
  setOverlappingEvents: (events: Event[]) => void;
  setIsOverlapDialogOpen: (isOpen: boolean) => void;
}

interface SaveRecurringEventsParams {
  formData: EventForm;
  isRepeating: boolean;
  repeatType: RepeatType;
  repeatInterval: number;
  repeatEndType: 'date' | 'count' | 'none';
  repeatEndDate?: string;
  repeatCount?: number;
}

export function useRecurringEvents({
  events,
  saveEvent,
  resetForm,
  setOverlappingEvents,
  setIsOverlapDialogOpen,
}: UseRecurringEventsProps) {
  const saveRecurringEvents = async ({
    formData,
    isRepeating,
    repeatType,
    repeatInterval,
    repeatEndType,
    repeatEndDate,
    repeatCount,
  }: SaveRecurringEventsParams) => {
    const startDateObj = new Date(formData.date);

    let effectiveEndDate: Date | undefined;
    let effectiveMaxCount: number | undefined;
    let effectiveMaxAbsoluteLimit: Date | undefined =
      isRepeating && repeatEndType === 'none' ? new Date('2025-09-30') : undefined;

    if (isRepeating) {
      if (repeatEndType === 'date') {
        effectiveEndDate = new Date(repeatEndDate!);
      } else if (repeatEndType === 'count') {
        effectiveMaxCount = repeatCount;
      }
    }

    const effectiveRepeatType: RepeatType =
      isRepeating && repeatType === 'none' ? 'daily' : repeatType;

    const allDates = isRepeating
      ? generateRepeatDates(
          startDateObj,
          effectiveRepeatType,
          repeatInterval,
          effectiveEndDate,
          effectiveMaxCount,
          effectiveMaxAbsoluteLimit
        )
      : [formData.date];

    for (const date of allDates) {
      const eventToSave: EventForm = {
        ...formData,
        date,
        repeat: {
          type: isRepeating ? repeatType : 'none',
          interval: repeatInterval,
          endDate: formData.repeat.endDate,
        },
      };

      const overlapping = findOverlappingEvents(eventToSave, events);
      if (overlapping.length > 0) {
        setOverlappingEvents(overlapping);
        setIsOverlapDialogOpen(true);
        return false;
      }

      await saveEvent(eventToSave as Event);
    }

    resetForm();
    return true;
  };

  return { saveRecurringEvents };
}
