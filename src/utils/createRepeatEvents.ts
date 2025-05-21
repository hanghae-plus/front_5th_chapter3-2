import { Event, RepeatType } from '../types';
import { formatDate } from './dateUtils';

// baseDate가 31일인 경우, n번째 31일이 있는 달의 31일 날짜를 반환
const getNthMonthWith31 = (baseDate: Date, n: number): Date => {
  let year = baseDate.getFullYear();
  let month = baseDate.getMonth();
  let count = 0;
  // n번째 31일이 존재하는 달을 찾을 때까지 달을 증가시킨다.
  while (count < n) {
    month++;
    if (month > 11) {
      year += Math.floor(month / 12);
      month = month % 12;
    }
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // 해당 달에 31일이 존재하면 count 증가
    if (daysInMonth >= 31) {
      count++;
    }
  }
  return new Date(year, month, 31);
};

const getNextMonth = (baseDate: Date, n: number): Date => {
  const nextMonth = baseDate.getMonth() + n;
  if (nextMonth > 11) {
    baseDate.setFullYear(baseDate.getFullYear() + Math.floor(nextMonth / 12));
  }
  baseDate.setMonth(nextMonth);
  return baseDate;
};

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
      // 31일 처리
      if (baseDate.getDate() === 31) {
        return getNthMonthWith31(baseDate, i);
      }
      return getNextMonth(baseDate, i);
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