import { RepeatInfo } from '../types';

/**
 * 반복 일정의 다음 날짜를 계산합니다.
 */
export const getNextRepeatDate = (currentDate: Date, repeatInfo: RepeatInfo): Date | null => {
  const nextDate = new Date(currentDate);

  switch (repeatInfo.type) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + repeatInfo.interval);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7 * repeatInfo.interval);
      break;
    case 'monthly':
      if (repeatInfo.monthlyRepeatType === 'weekday' && repeatInfo.monthlyWeekday) {
        // 특정 주차의 특정 요일로 설정
        const { week, day } = repeatInfo.monthlyWeekday;
        nextDate.setDate(1); // 다음달 1일로 설정
        nextDate.setMonth(nextDate.getMonth() + repeatInfo.interval);

        // 해당 요일로 이동
        while (nextDate.getDay() !== day) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        // 원하는 주차로 이동
        nextDate.setDate(nextDate.getDate() + (week - 1) * 7);
      } else {
        // 특정 날짜로 설정
        nextDate.setMonth(nextDate.getMonth() + repeatInfo.interval);
      }
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + repeatInfo.interval);
      break;
    default:
      return null;
  }

  return nextDate;
};

/**
 * 반복 일정의 종료 조건을 확인합니다.
 */
export const isRepeatEnded = (currentDate: Date, repeatInfo: RepeatInfo): boolean => {
  if (repeatInfo.endType === 'never') return false;

  if (repeatInfo.endType === 'date' && repeatInfo.endDate) {
    return currentDate > new Date(repeatInfo.endDate);
  }

  if (repeatInfo.endType === 'count' && repeatInfo.endCount) {
    // TODO: 반복 횟수 체크 로직 구현
    return false;
  }

  return false;
};

/**
 * 특정 날짜가 제외된 날짜인지 확인합니다.
 */
export const isExcludedDate = (date: Date, repeatInfo: RepeatInfo): boolean => {
  if (!repeatInfo.excludedDates) return false;

  const dateString = date.toISOString().split('T')[0];
  return repeatInfo.excludedDates.includes(dateString);
};

/**
 * 주간 반복에서 특정 요일이 선택된 요일인지 확인합니다.
 */
export const isSelectedWeekday = (date: Date, repeatInfo: RepeatInfo): boolean => {
  if (!repeatInfo.daysOfWeek) return true;

  return repeatInfo.daysOfWeek.includes(date.getDay());
};
