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

export function getEventsForDay(events: Event[], date: number, viewDate?: Date): Event[] {
  return events.filter((event) => {
    const eventDate = new Date(event.date);
    const currentDate = viewDate
      ? new Date(viewDate.getFullYear(), viewDate.getMonth(), date)
      : new Date(eventDate.getFullYear(), eventDate.getMonth(), date);
    const dateString = currentDate.toISOString().split('T')[0];

    // 반복 일정이 아닌 경우 단순 날짜 비교
    if (event.repeat.type === 'none') {
      return eventDate.getDate() === date && 
             eventDate.getMonth() === currentDate.getMonth() && 
             eventDate.getFullYear() === currentDate.getFullYear();
    }

    // 종료일이 있고, 현재 날짜가 종료일을 넘었으면 표시하지 않음
    if (event.repeat.endDate && dateString > event.repeat.endDate) {
      return false;
    }

    // 시작일보다 이전 날짜면 표시하지 않음
    if (dateString < event.date) {
      return false;
    }

    // 반복 간격에 따른 표시 여부 계산
    const startDate = new Date(event.date);
    const diffTime = currentDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    switch (event.repeat.type) {
      case 'daily':
        return diffDays % event.repeat.interval === 0;
      case 'weekly':
        return diffDays % (7 * event.repeat.interval) === 0;
      case 'monthly':
        const monthDiff =
          (currentDate.getFullYear() - startDate.getFullYear()) * 12 +
          (currentDate.getMonth() - startDate.getMonth());
        return monthDiff % event.repeat.interval === 0 && currentDate.getDate() === startDate.getDate();
      case 'yearly':
        const yearDiff = currentDate.getFullYear() - startDate.getFullYear();
        return (
          yearDiff % event.repeat.interval === 0 &&
          currentDate.getMonth() === startDate.getMonth() &&
          currentDate.getDate() === startDate.getDate()
        );
      default:
        return false;
    }
  });
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
