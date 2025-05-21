import { Event, RepeatType } from '../types';
import { formatDate } from './dateUtils';

const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const getNextLeapYear = (year: number, i: number): number => {
  let leapCount = 0;
  // i번째 다음 윤년을 찾는다.
  while (leapCount < i) {
    if (isLeapYear(++year)) {
      leapCount++;
    }
  }
  return year;
}

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
      // 윤년 처리
      if (baseDate.getMonth() === 1 && baseDate.getDate() === 29) {
        const nextLeapYear = getNextLeapYear(baseDate.getFullYear(), i);
        nextDate.setFullYear(nextLeapYear);
      } else {
        // 2월 29일이 아니면 일반적으로 i년을 더한다.
        nextDate.setFullYear(nextDate.getFullYear() + i);
      }
      break;
  }
  return nextDate;
}

export const createRepeatEvents = (event: Event): Event[] => {
  const { repeat } = event;
  if (!repeat || repeat.type === 'none') {
    return [];
  }

  const repeatEvents: Event[] = [];

  const startDate = new Date(event.date);
  const maxDate = new Date('2025-09-30'); // endDate가 주어지지 않았을 때 반복 이벤트의 최대 날짜 설정 (2025년 9월 30일)
  const endDate = repeat.endDate ? new Date(repeat.endDate) : maxDate;
  
  let currentDate = new Date(startDate);
  let eventIdCounter = 1;
  const repeatGroupId = `repeat-${event.id}`;
  
  while (currentDate <= endDate && currentDate <= maxDate) {
    const newEvent: Event = {
      ...event,
      id: `${eventIdCounter}`,
      date: formatDate(currentDate),
      repeat: {
        ...event.repeat,
        id: repeatGroupId,
      },
    }
    repeatEvents.push(newEvent);
    
    const nextDate = getNextRepeatDate(currentDate, repeat.type, repeat.interval || 1);
    if (!nextDate || nextDate > endDate || nextDate > maxDate) break;

    currentDate = nextDate;
    eventIdCounter++;
  }

  return repeatEvents;
}; 