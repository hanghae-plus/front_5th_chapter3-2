/* eslint-disable no-constant-condition */
import { Event, RepeatType } from '../types';

const getLastDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const getNextDate = (
  baseDate: string,
  type: RepeatType,
  interval: number,
  startDay: number
): string => {
  const [year, month, day] = baseDate.split('-').map(Number);
  const current = new Date(year, month - 1, day);

  switch (type) {
    case RepeatType.MONTHLY: {
      const targetMonth = current.getMonth() + interval;
      const targetYear = current.getFullYear() + Math.floor(targetMonth / 12);
      const adjustedMonth = targetMonth % 12;
      const lastDay = getLastDayOfMonth(targetYear, adjustedMonth);
      const newDay = Math.min(startDay, lastDay);
      return new Date(targetYear, adjustedMonth, newDay).toISOString().split('T')[0];
    }
    // 다른 타입은 기존처럼 처리
    case RepeatType.DAILY:
      current.setDate(current.getDate() + interval);
      break;
    case RepeatType.WEEKLY:
      current.setDate(current.getDate() + interval * 7);
      break;
    case RepeatType.YEARLY:
      current.setFullYear(current.getFullYear() + interval);
      break;
  }

  return current.toISOString().split('T')[0];
};

/**
 *
 * @param events 반복 설정에 필요한 event 입니다.
 */
export const repeatUtils = (event: Event): Event[] => {
  const { repeat, date } = event;

  if (repeat.type === RepeatType.NONE) {
    return [event];
  }

  const result: Event[] = [];
  let currentDate = date;
  const startDay = Number(date.split('-')[2]);

  while (true) {
    result.push({
      ...event,
      date: currentDate,
    });

    const nextDate = getNextDate(currentDate, repeat.type, repeat.interval, startDay);
    if (repeat.endDate && nextDate > repeat.endDate) break;

    currentDate = nextDate;
  }

  return result;
};
