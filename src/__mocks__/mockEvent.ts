import { Event } from '../types';
import mockEventJson from './response/events.json';

export const mockEventsData: Event[] = [...(mockEventJson.events as Event[])]; // 참조 유지
