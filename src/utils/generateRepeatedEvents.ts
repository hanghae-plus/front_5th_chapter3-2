import { EventForm, RepeatType } from '../types';

export function generateRepeatedEvents(base: EventForm): EventForm[] {
  const { date, repeat, ...rest } = base;
  const result: EventForm[] = [];

  const startDate = new Date(date);
  const endDate = repeat.endDate ? new Date(repeat.endDate) : new Date('2025-09-30');

  let currentDate = new Date(startDate);
  let count = 0;
  const maxCount = repeat.count ?? Infinity;

  const getNextDate = (date: Date, type: RepeatType, interval: number): Date => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    switch (type) {
      case 'daily':
        return new Date(year, month, day + interval);
      case 'weekly':
        return new Date(year, month, day + interval * 7);
      case 'monthly': {
        const nextMonthDate = new Date(year, month + interval, day);
        if (nextMonthDate.getDate() !== day) {
          // 말일 보정
          return new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1, 0);
        }
        return nextMonthDate;
      }
      case 'yearly': {
        const nextYearDate = new Date(year + interval, month, day);
        if (nextYearDate.getDate() !== day) {
          // 윤년 보정
          return new Date(nextYearDate.getFullYear(), nextYearDate.getMonth() + 1, 0);
        }
        return nextYearDate;
      }
      default:
        return date;
    }
  };

  while (currentDate <= endDate && count < maxCount) {
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dd = String(currentDate.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    result.push({
      ...rest,
      date: formattedDate,
      repeat,
    });

    currentDate = getNextDate(currentDate, repeat.type, repeat.interval);
    count++;
  }

  return result;
}
