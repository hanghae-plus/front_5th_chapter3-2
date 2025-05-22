import { Event } from '../types.ts';

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
 * 날짜 문자열에서 Date 객체 생성 시 타임존 문제 해결을 위한 유틸리티
 * @param dateString - YYYY-MM-DD 형식의 날짜 문자열
 * @param endOfDay - true이면 해당 날짜의 마지막 순간(23:59:59.999)으로 설정
 * @returns 정규화된 Date 객체
 * ex) 2025-05-22 -> 2025-05-22T00:00:00.000Z
 */
export function createDate(dateString: string, endOfDay = false): Date {
  const [year, month, day] = dateString.split('-').map(Number);

  // JavaScript에서 month는 0부터 시작 (1월 = 0)
  const date = new Date(year, month - 1, day);

  if (endOfDay) {
    // 해당 날짜의 23:59:59.999로 설정 (하루의 끝)
    date.setHours(23, 59, 59, 999);
  } else {
    // 해당 날짜의 00:00:00.000으로 설정 (하루의 시작)
    date.setHours(0, 0, 0, 0);
  }

  return date;
}

/**
 * 주어진 날짜의 월의 마지막 날짜를 문자열로 반환합니다.
 * @param date - 날짜 객체
 * @returns YYYY-MM-DD 형식의 문자열
 * ex) 2025-05-22 -> 2025-05-31
 */
export function getLastDateStringOfMonth(date: Date): string {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
}

/**
 * 주어진 날짜와 뷰에 따른 시작일과 종료일을 반환합니다.
 * @param date - 날짜 객체
 * @param view - 'week' 또는 'month'
 * @returns 시작일과 종료일을 포함한 객체
 * ex) { startDate: 2025-05-22T00:00:00.000Z, endDate: 2025-05-28T23:59:59.999Z }
 */
export function getDateRange(
  date: Date,
  view: 'week' | 'month'
): { startDate: Date; endDate: Date } {
  if (view === 'week') {
    // 주 범위 계산 (일요일 ~ 토요일)
    const weekDates = getWeekDates(date);
    const startDate = new Date(weekDates[0]);
    startDate.setHours(0, 0, 0, 0); // 시작일은 00:00:00.000

    const endDate = new Date(weekDates[6]);
    endDate.setHours(23, 59, 59, 999); // 종료일은 23:59:59.999

    return { startDate, endDate };
  } else {
    // 월 범위 계산 (1일 ~ 말일)
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    return { startDate, endDate };
  }
}
