import { Event, RepeatType } from '../types.ts';

/**
 * 주어진 년도와 월의 일수를 반환합니다.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * 주어진 날짜가 속한 주의 모든 날짜를 반환합니다.
 */
export function getWeekDates(date: Date): Date[] {
  const day = date.getDay();
  const diff = date.getDate() - day;
  const sunday = new Date(date.setDate(diff));
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(sunday);
    nextDate.setDate(sunday.getDate() + i);
    weekDates.push(nextDate);
  }
  return weekDates;
}

export function getWeeksAtMonth(currentDate: Date) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month + 1);
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weeks = [];

  const initWeek = () => Array(7).fill(null);

  let week: Array<number | null> = initWeek();

  for (let i = 0; i < firstDayOfMonth; i++) {
    week[i] = null;
  }

  for (const day of days) {
    const dayIndex = (firstDayOfMonth + day - 1) % 7;
    week[dayIndex] = day;
    if (dayIndex === 6 || day === daysInMonth) {
      weeks.push(week);
      week = initWeek();
    }
  }

  return weeks;
}

export function getEventsForDay(events: Event[], date: number): Event[] {
  return events.filter((event) => new Date(event.date).getDate() === date);
}

export function formatWeek(targetDate: Date) {
  const dayOfWeek = targetDate.getDay();
  const diffToThursday = 4 - dayOfWeek;
  const thursday = new Date(targetDate);
  thursday.setDate(targetDate.getDate() + diffToThursday);

  const year = thursday.getFullYear();
  const month = thursday.getMonth() + 1;

  const firstDayOfMonth = new Date(thursday.getFullYear(), thursday.getMonth(), 1);

  const firstThursday = new Date(firstDayOfMonth);
  firstThursday.setDate(1 + ((4 - firstDayOfMonth.getDay() + 7) % 7));

  const weekNumber: number =
    Math.floor((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  return `${year}년 ${month}월 ${weekNumber}주`;
}

/**
 * 주어진 날짜의 월 정보를 "YYYY년 M월" 형식으로 반환합니다.
 */
export function formatMonth(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}년 ${month}월`;
}

const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * 주어진 날짜가 특정 범위 내에 있는지 확인합니다.
 */
export function isDateInRange(date: Date, rangeStart: Date, rangeEnd: Date): boolean {
  const normalizedDate = stripTime(date);
  const normalizedStart = stripTime(rangeStart);
  const normalizedEnd = stripTime(rangeEnd);

  return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
}

export function fillZero(value: number, size = 2) {
  return String(value).padStart(size, '0');
}

export function formatDate(currentDate: Date, day?: number) {
  return [
    currentDate.getFullYear(),
    fillZero(currentDate.getMonth() + 1),
    fillZero(day ?? currentDate.getDate()),
  ].join('-');
}

/**
 * 주어진 시작일부터 특정 반복 규칙에 따라 유효한 날짜 목록을 생성합니다.
 *
 * @param {string} startDate - 반복 시작 날짜 (YYYY-MM-DD 형식).
 * @param {RepeatType} repeatType - 반복 유형 ('daily', 'weekly', 'monthly', 'yearly').
 * @param {number} interval - 반복 간격 (1 이상의 양수).
 * @param {string} [endDate] - 반복 종료 날짜 (YYYY-MM-DD 형식, 선택 사항). 이 날짜를 포함합니다.
 * @returns {string[]} 반복되는 날짜들의 문자열 배열 (YYYY-MM-DD 형식)
 */
export function getRepeatDates(
  startDate: string,
  repeatType: RepeatType,
  interval: number,
  endDate?: string
): string[] {
  const results: string[] = [];

  if (interval <= 0) {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : undefined;
    return !end || start <= end ? [formatDate(start)] : [];
  }

  let currentDate = new Date(startDate);
  const initialDate = new Date(startDate);
  const finalDate = endDate ? new Date(endDate) : undefined;

  if (finalDate && currentDate > finalDate) return [];

  const MAX_ITERATIONS = 1000;
  let count = 0;

  const shouldContinue = () => (!finalDate || currentDate <= finalDate) && count < MAX_ITERATIONS;

  while (shouldContinue()) {
    results.push(formatDate(currentDate));
    count++;

    const prev = currentDate.getTime();
    currentDate = calculateNextRepeatDate(currentDate, initialDate, repeatType, interval);

    if (currentDate.getTime() === prev) {
      console.warn(
        `Infinite loop detected: repeatType=${repeatType}, date=${formatDate(currentDate)}`
      );
      break;
    }
  }

  return results;
}

/**
 * 현재 반복 날짜와 규칙에 따라 다음 반복 날짜를 계산합니다.
 * 이 함수는 getRepeatDates의 헬퍼 함수입니다.
 *
 * @private
 * @param {Date} currentIterationDate - 현재 반복 계산의 기준이 되는 Date 객체.
 * @param {Date} originalStartDate - 반복 규칙의 기준이 되는 최초 시작 Date 객체.
 * @param {RepeatType} repeatType - 반복 유형.
 * @param {number} interval - 반복 간격.
 * @returns {Date} 계산된 다음 반복 날짜를 나타내는 새로운 Date 객체.
 */
export function calculateNextRepeatDate(
  currentIterationDate: Date,
  originalStartDate: Date,
  repeatType: RepeatType,
  interval: number
): Date {
  const nextDate = new Date(currentIterationDate);

  switch (repeatType) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval);
      return nextDate;

    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7 * interval);
      return nextDate;

    case 'monthly': {
      const originalDay = originalStartDate.getDate();
      const nextMonth = nextDate.getMonth() + interval;
      const temp = new Date(nextDate.getFullYear(), nextMonth, 1);

      const year = temp.getFullYear();
      const month = temp.getMonth();
      const maxDay = getDaysInMonth(year, month + 1);

      return new Date(year, month, Math.min(originalDay, maxDay));
    }

    case 'yearly': {
      const originalDay = originalStartDate.getDate();
      const originalMonth = originalStartDate.getMonth();
      const nextYear = nextDate.getFullYear() + interval;
      const maxDay = getDaysInMonth(nextYear, originalMonth + 1);

      return new Date(nextYear, originalMonth, Math.min(originalDay, maxDay));
    }

    default:
      console.error(`Unknown repeat type in calculateNextRepeatDate: ${repeatType}`);
      return nextDate;
  }
}
