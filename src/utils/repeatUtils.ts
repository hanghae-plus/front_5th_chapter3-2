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

export function generateMonthlyRepeats(startDate: Date, endDate: Date): Date[] {}
