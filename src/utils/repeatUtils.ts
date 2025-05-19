import { isDateInRange } from './dateUtils';

/** 매년 반복되는 일정 */
export function generateYearlyRepeats(startDate: Date, endDate: Date): Date[] {
  const result: Date[] = [];

  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const month = startDate.getMonth();
  const day = startDate.getDate();

  for (let year = startYear; year <= endYear; year++) {
    const date = new Date(year, month, day); // 날짜가 존재하지않으면 js는 알아서 그 다음일자로 바뀐다.

    if (date.getDate() !== day) continue;

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

/** 매월 반복되는 일정 */
export function generateMonthlyRepeats(startDate: Date, endDate: Date): Date[] {
  const result: Date[] = [];

  const day = startDate.getDate();
  const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1); //2025-05-01

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (isValidRepeatDay(year, month, day)) {
      const date = new Date(year, month, day);

      if (isDateInRange(date, startDate, endDate)) {
        result.push(date);
      }
    }

    currentDate.setMonth(month + 1); // 다음 달로 이동시킴
  }
  return result;
}

export function generateDailyRepeats(startDate: Date, endDate: Date): Date[] {}
