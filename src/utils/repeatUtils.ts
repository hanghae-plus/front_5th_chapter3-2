import { RepeatType } from '../types.ts';

/**
 * 날짜를 YYYY-MM-DD 문자열로 포맷
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 반복 날짜를 배열에 추가
 */
function appendFormattedDate(dates: string[], date: Date): void {
  dates.push(formatDateToYYYYMMDD(date));
}

/**
 * 해당 월의 마지막 일 반환
 */
export function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * 주어진 반복 타입과 간격에 따라 다음 반복 날짜 반환
 */
export function getNextDate(current: Date, type: RepeatType, interval: number): Date | null {
  const y = current.getFullYear();
  const m = current.getMonth();
  const d = current.getDate();

  switch (type) {
    case 'daily': {
      const next = new Date(current.getTime());
      next.setDate(next.getDate() + interval);
      return next;
    }
    case 'weekly': {
      const next = new Date(current.getTime());
      next.setDate(next.getDate() + interval * 7);
      return next;
    }
    case 'monthly': {
      const isEndOfMonth = d === getLastDayOfMonth(y, m);

      const targetMonth = m + interval;
      const targetYear = y + Math.floor(targetMonth / 12);
      const normalizedMonth = targetMonth % 12;

      const nextMonthLast = getLastDayOfMonth(targetYear, normalizedMonth);
      const nextDay = isEndOfMonth ? nextMonthLast : Math.min(d, nextMonthLast);

      return new Date(targetYear, normalizedMonth, nextDay);
    }
    case 'yearly': {
      const targetYear = y + interval;
      if (m === 1 && d === 29) {
        const isLeap = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        if (!isLeap(targetYear)) return null; // 윤년 아닌 해는 null
      }
      return new Date(targetYear, m, d);
    }
    default:
      return null;
  }
}

/**
 * 다음 유효한 반복 날짜 계산
 */
function findNextValidDate(
  current: Date,
  type: RepeatType,
  interval: number,
  endDate?: Date
): Date | null {
  if (type !== 'yearly') {
    const candidate = getNextDate(current, type, interval);
    if (!candidate) return null;
    // if (endDate && candidate > endDate) return null;
    if (endDate && candidate.getTime() > endDate.getTime()) return null;
    return candidate;
  }

  for (let i = 1; i < 5; i++) {
    const candidate = getNextDate(current, type, interval * i);
    if (!candidate) continue;
    // if (endDate && candidate > endDate) return null;
    if (endDate && candidate.getTime() > endDate.getTime()) return null;
    return candidate;
  }

  return null;
}

/**
 * 시작일로부터 반복 종료일까지 반복 날짜 리스트 생성
 */
export function generateRepeatDates(
  start: Date,
  type: RepeatType,
  interval: number,
  endDate?: Date,
  maxCount?: number,
  maxAbsoluteLimit?: Date
): string[] {
  const dates: string[] = [];
  let current = new Date(start.getTime());
  let count = 0;

  while (true) {
    if (maxAbsoluteLimit && current.getTime() > maxAbsoluteLimit.getTime()) break;

    appendFormattedDate(dates, current);
    count++;

    if (maxCount && count >= maxCount) break;

    const effectiveEndDate = endDate ?? maxAbsoluteLimit;
    const next = findNextValidDate(current, type, interval, effectiveEndDate);

    // 내부 제한 등록일 (2025.09.30)
    if (!next) break;
    if (maxAbsoluteLimit && next.getTime() > maxAbsoluteLimit.getTime()) break;

    current = next;
  }

  return dates;
}
