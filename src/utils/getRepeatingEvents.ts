import { Event, EventForm } from '../types';
import { formatDate, getDaysInMonth } from './dateUtils';

export const getRepeatingEvents = (eventData: Event | EventForm) => {
  const eventList: Event[] = [];
  const eventDate = new Date(eventData.date);
  const days = getDaysInMonth(eventDate.getFullYear(), eventDate.getMonth() + 1);

  if (eventData.repeat.type === 'daily') {
    // 해당 월로 넘어가면 그 때 생성 제너레이터?
    const limitedNum = new Date(eventData.date).getDate();
    const date = new Date(eventData.date);

    for (let i = limitedNum; i <= days; i++) {
      date.setDate(i);

      eventList.push({ ...eventData, id: '2', date: formatDate(date) });
    }
  }
  return eventList;
};
