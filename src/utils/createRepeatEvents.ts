import { formatDate } from './dateUtils';
import { EventForm } from '../types';

export const createRepeatEvents = (eventData: EventForm) => {
  const { type, interval, endDate } = eventData.repeat;
  const startDate = new Date(eventData.date);
  const maxEndDate = new Date('2025-09-30');
  const repeatEndDate = endDate ? new Date(endDate) : maxEndDate;

  if (type === 'none' || interval === 0) {
    return [eventData];
  }

  const dates = [];

  let currentDate = startDate;

  while (currentDate <= repeatEndDate) {
    dates.push({
      ...eventData,
      date: formatDate(currentDate),
    });

    switch (type) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7 * interval);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + interval);

        // 월말 처리 (예: 1월 31일 -> 2월 28일)
        const newMonth = currentDate.getMonth();
        const expectedMonth = (startDate.getMonth() + interval * dates.length) % 12;

        if (newMonth !== expectedMonth) {
          // 월이 예상과 다르면 전월의 마지막 날로 설정
          currentDate.setDate(0);
        }
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + interval);
        break;
    }
  }

  return dates;
};
