import { RepeatInfo } from '../types';

/** YYYY-MM-DD 형식 문자열을 Date 객체로 변환 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

/** Date 객체를 YYYY-MM-DD 형식 문자열로 변환 */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**  특정 연도, 월의 마지막 날짜를 구함 */
export function getLastDateOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** 월별 반복 시 다음 반복 날짜를 계산  */
export function getNextMonthlyDate(
  current: Date,
  interval: number,
  startDay: number,
  startIsLastDay: boolean
): Date {
  let year = current.getFullYear();
  let month = current.getMonth() + interval;
  year += Math.floor(month / 12);
  month = month % 12;

  const lastDay = getLastDateOfMonth(year, month);
  const day = startIsLastDay ? lastDay : Math.min(startDay, lastDay);

  return new Date(year, month, day);
}

/** 연별 반복 시 다음 반복 날짜를 계산 */
export function getNextYearlyDate(current: Date, interval: number, startDay: number): Date {
  const year = current.getFullYear() + interval;
  const month = current.getMonth();

  const lastDay = getLastDateOfMonth(year, month);
  const day =
    startDay === 29 && month === 1 // 2월 29일 윤년 처리
      ? lastDay
      : Math.min(startDay, lastDay);

  return new Date(year, month, day);
}

/** 반복 일정을 시작일과 반복 정보로 계산하여 날짜 배열 반환  */
export function generateRepeatDatesFromEvent(startDate: string, repeat: RepeatInfo): string[] {
  if (repeat.type === 'none' || !repeat.endDate) return [];

  const dates: string[] = [];
  let current = parseDate(startDate);
  const end = parseDate(repeat.endDate);

  const startDay = current.getDate();
  const startIsLastDay = startDay === getLastDateOfMonth(current.getFullYear(), current.getMonth());

  while (current <= end) {
    dates.push(formatDate(current));

    switch (repeat.type) {
      case 'daily':
        current = new Date(current);
        current.setDate(current.getDate() + repeat.interval);
        break;
      case 'weekly':
        current = new Date(current);
        current.setDate(current.getDate() + repeat.interval * 7);
        break;
      case 'monthly':
        current = getNextMonthlyDate(current, repeat.interval, startDay, startIsLastDay);
        break;
      case 'yearly':
        current = getNextYearlyDate(current, repeat.interval, startDay);
        break;
      default:
        // none 이거나 알 수 없는 타입인 경우 종료
        return dates;
    }
  }

  return dates;
}
