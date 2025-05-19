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

    currentStartDate.setMonth(month + 1); // 다음 달로 이동시킴
  }
  return result;
}

/**daily 반복 일정 */
export function generateDailyRepeats(startDate: Date, endDate: Date, interval: number): Date[] {
  const result: Date[] = [];
  const currentDate = new Date(startDate); // 5-19

  while (currentDate <= endDate) {
    result.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + interval);
  }

  return result;
}
