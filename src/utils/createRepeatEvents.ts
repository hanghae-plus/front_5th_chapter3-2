import { Event, RepeatType } from '../types';
import { formatDate } from './dateUtils';

// 반복 타입에 따라 다음 날짜를 계산해 리턴
const getNextRepeatDate = (baseDate: Date, type: RepeatType, i: number): Date => {
  const nextDate = new Date(baseDate);
  switch (type) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + i);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + i * 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + i);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + i);
      break;
  }
  return nextDate;
}

export const createRepeatEvents = (event: Event): Event[] => {
  
  const { type, interval } = event.repeat;
  const baseDate = new Date(event.date);

  // 원래 일정 포함 + 추가 반복 일정
  // ex) interval이 1이면 두 개의 이벤트(원래 일정 + 1회 반복)를 생성
  const repeatEvents = Array.from({ length: interval + 1 }, (_, i) => ({
    ...event,
    date: formatDate(getNextRepeatDate(baseDate, type, i)),
    repeat: {
      ...event.repeat,
      id: `repeat-${i + 1}`
    }
  }));

  return repeatEvents;
}; 