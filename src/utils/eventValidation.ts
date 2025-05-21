import type { Event, EventForm } from '../types';

export type SaveEventData = Event | EventForm | Event[];

export const isRepeating = (eventData: Event | EventForm) =>
  eventData.repeat && eventData.repeat.type !== 'none';

export const isSaving = (
  editing: boolean,
  eventData: SaveEventData
): eventData is Event | EventForm => !editing && !Array.isArray(eventData);
