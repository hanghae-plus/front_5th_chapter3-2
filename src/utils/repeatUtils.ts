import { Event, RepeatInfo } from '../types';
import { isDateInRange } from './dateUtils';

/** 매년 반복되는 일정 */
export function generateYearlyRepeats(startDate: Date, endDate: Date, interval: number): Date[] {
  const result: Date[] = [];

  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const month = startDate.getMonth();
  const day = startDate.getDate();

  for (let year = startYear; year <= endYear; year += interval) {
    const date = new Date(year, month, day); // 날짜가 존재하지않으면 js는 알아서 그 다음일자로 바뀐다.

    if (date.getMonth() !== month || date.getDate() !== day) continue;

    if (isDateInRange(date, startDate, endDate)) {
      result.push(date);
    }
  }
  return result;
}

const isValidRepeatDay = (year: number, month: number, targetDay: number): boolean => {
  const date = new Date(year, month, targetDay);
  return date.getDate() === targetDay;
};

/** n개월마다 반복되는 일정 생성 */
export function generateMonthlyRepeats(startDate: Date, endDate: Date, interval: number): Date[] {
  const result: Date[] = [];

  const day = startDate.getDate();
  const currentStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1); //2025-05-01

  while (currentStartDate <= endDate) {
    const year = currentStartDate.getFullYear();
    const month = currentStartDate.getMonth();

    if (isValidRepeatDay(year, month, day)) {
      const date = new Date(year, month, day);

      if (isDateInRange(date, startDate, endDate)) {
        result.push(date);
      }
    }
    // interval(월 단위)만큼 증가
    currentStartDate.setMonth(month + interval);
  }
  return result;
}

export function generateYearlyRepeatsByCount(
  startDate: Date,
  interval: number,
  count: number
): Date[] {
  const result: Date[] = [];
  let current = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const year = current.getFullYear();
    const month = current.getMonth();
    const day = current.getDate();

    const nextDate = new Date(year, month, day);

    // 윤년 보정: 2월 29일이 아닌 경우는 스킵
    if (month === 1 && day === 29 && (nextDate.getMonth() !== 1 || nextDate.getDate() !== 29)) {
      // 윤년이 아닌 경우 → 스킵하고 다음 연도로 건너뜀
      current.setFullYear(year + interval);
      i--; // 이 반복은 유효하지 않으므로 카운트 무효 처리
      continue;
    }

    result.push(nextDate);
    current.setFullYear(current.getFullYear() + interval);
  }

  return result;
}

export function generateMonthlyRepeatsByCount(
  startDate: Date,
  interval: number,
  count: number
): Date[] {
  const result: Date[] = [];
  let current = new Date(startDate);

  for (let i = 0; i < count; i++) {
    result.push(new Date(current));
    current.setMonth(current.getMonth() + interval);
  }

  return result;
}

/**daily 반복 일정 */
export function generateDailyRepeats(startDate: Date, endDate: Date, interval: number): Date[] {
  const result: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    result.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + interval);
  }

  return result;
}

export function generateDailyRepeatsByCount(
  startDate: Date,
  interval: number,
  count: number
): Date[] {
  const result: Date[] = [];
  let current = new Date(startDate);

  for (let i = 0; i < count; i++) {
    result.push(new Date(current));
    current.setDate(current.getDate() + interval);
  }

  return result;
}

/**매주 반복되는 일정 */
export function generateWeeklyRepeats(startDate: Date, endDate: Date, interval: number): Date[] {
  const result: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    result.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + interval * 7);
  }
  return result;
}

export function generateWeeklyRepeatsByCount(
  startDate: Date,
  interval: number,
  count: number
): Date[] {
  const result: Date[] = [];
  let current = new Date(startDate);

  for (let i = 0; i < count; i++) {
    result.push(new Date(current));
    current.setDate(current.getDate() + 7 * interval);
  }

  return result;
}

/**
 * 주어진 반복 설정에 따라 반복 일정을 생성합니다.
 *
 * @param startDate - 반복 시작 날짜
 * @param repeat - 반복 설정 정보 (유형, 간격, 종료 날짜 포함)
 * @returns 반복 일정의 날짜 배열
 *
 */

export function generateRepeats(
  startDate: Date,
  repeat: RepeatInfo,
  maxCount: number = 1000
): Date[] {
  const { type, interval, endDate, count } = repeat;

  if (endDate) {
    const end = new Date(endDate);
    switch (type) {
      case 'daily':
        return generateDailyRepeats(startDate, end, interval);
      case 'weekly':
        return generateWeeklyRepeats(startDate, end, interval);
      case 'monthly':
        return generateMonthlyRepeats(startDate, end, interval);
      case 'yearly':
        return generateYearlyRepeats(startDate, end, interval);
      default:
        throw new Error(`Unsupported repeat type: ${type}`);
    }
  } else if (count) {
    // 종료일 없이 count만 주어진 경우
    switch (type) {
      case 'daily':
        return generateDailyRepeatsByCount(startDate, interval, count);
      case 'weekly':
        return generateWeeklyRepeatsByCount(startDate, interval, count);
      case 'monthly':
        return generateMonthlyRepeatsByCount(startDate, interval, count);
      case 'yearly':
        return generateYearlyRepeatsByCount(startDate, interval, count);
      default:
        throw new Error(`Unsupported repeat type: ${type}`);
    }
  } else {
    // 종료 조건이 없으면 maxCount 만큼 반복
    switch (type) {
      case 'daily':
        return generateDailyRepeatsByCount(startDate, interval, maxCount);
      case 'weekly':
        return generateWeeklyRepeatsByCount(startDate, interval, maxCount);
      case 'monthly':
        return generateMonthlyRepeatsByCount(startDate, interval, maxCount);
      case 'yearly':
        return generateYearlyRepeatsByCount(startDate, interval, maxCount);
      default:
        throw new Error(`Unsupported repeat type: ${type}`);
    }
  }
}

/** 반복 설정에 따라 반복 일정들을 생성해주는 함수 */

export const generateRepeatedEvents = (baseEvent: Event): Event[] => {
  const { repeat, ...rest } = baseEvent;

  if (repeat.type === 'none') return [];

  const startDate = new Date(baseEvent.date);
  const repeatDates = generateRepeats(startDate, repeat);

  return repeatDates.map((date) => ({
    ...rest,
    date: date.toISOString().split('T')[0],
    repeat,
  }));
};
