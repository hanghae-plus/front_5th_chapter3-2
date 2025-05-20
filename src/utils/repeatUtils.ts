import { formatDate, getDaysInMonth } from './dateUtils';
import { Event, RepeatInfo, RepeatType } from '../types';

// --- End of helper function ---
function generateSimpleId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}
export function adjustDateForRepeat(
  year: number,
  month: number, // 0-11 (Date 객체 기준)
  originalDay: number // 반복 시작일의 '일' (예: 31일)
): string {
  const daysInTargetMonth = getDaysInMonth(year, month + 1);
  const adjustedDay = originalDay > daysInTargetMonth ? daysInTargetMonth : originalDay;
  const dateObj = new Date(year, month, adjustedDay);
  return formatDate(dateObj);
}
export function calculateNextRepeatDate(
  currentDateStr: string, // YYYY-MM-DD 형식
  repeatType: RepeatType,
  interval: number,
  originalStartDay: number // <<-- 추가된 매개변수: 원래 반복 시작의 '일'
): string {
  const [year, monthStr, dayStr] = currentDateStr.split('-').map(Number);
  const currentYear = year;
  const currentMonth = monthStr - 1; // JS Date month는 0-indexed
  // const originalDayOfMonth = dayStr; // 이 줄 대신 originalStartDay 사용

  let targetYear: number;
  let targetMonth: number;

  switch (repeatType) {
    case 'daily': {
      const currentDateObj = new Date(currentYear, currentMonth, dayStr); // 일일 반복은 현재 '일'에서 시작
      currentDateObj.setDate(currentDateObj.getDate() + interval);
      return formatDate(currentDateObj);
    }
    case 'weekly': {
      const currentDateObj = new Date(currentYear, currentMonth, dayStr); // 주간 반복도 현재 '일'에서 시작
      currentDateObj.setDate(currentDateObj.getDate() + 7 * interval);
      return formatDate(currentDateObj);
    }
    case 'monthly': {
      targetMonth = currentMonth + interval;
      targetYear = currentYear + Math.floor(targetMonth / 12);
      targetMonth = targetMonth % 12;
      if (targetMonth < 0) {
        targetMonth += 12;
        targetYear--;
      }
      // 여기서 originalStartDay 사용
      return adjustDateForRepeat(targetYear, targetMonth, originalStartDay);
    }
    case 'yearly': {
      targetYear = currentYear + interval;
      targetMonth = currentMonth;
      // 여기서 originalStartDay 사용
      return adjustDateForRepeat(targetYear, targetMonth, originalStartDay);
    }
    default:
      return currentDateStr;
  }
}

export function generateRepeatingEvents(
  baseEvent: Omit<Event, 'id' | 'repeat'>,
  repeatInfo: RepeatInfo,
  repeatGroupId: string
): Event[] {
  const { type: repeatType, interval, endDate: repeatEndDateStr } = repeatInfo;
  const generatedEvents: Event[] = [];

  if (repeatType === 'none') {
    return generatedEvents;
  }

  if (!repeatEndDateStr && repeatInfo.endDate === undefined) {
    return [];
  }

  let currentDateStr = baseEvent.date;
  const [startYear, startMonth, startDay] = baseEvent.date.split('-').map(Number);
  const originalStartDayOfMonth = startDay; // <<-- 원래 반복 시작일의 '일'을 저장

  const repeatEndDate = repeatEndDateStr ? new Date(repeatEndDateStr + 'T23:59:59') : null;

  generatedEvents.push({
    ...baseEvent,
    id: generateSimpleId(),
    repeat: {
      ...repeatInfo,
      id: repeatGroupId,
    },
    date: currentDateStr,
  });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // calculateNextRepeatDate 호출 시 originalStartDayOfMonth 전달
    const nextDateStr = calculateNextRepeatDate(
      currentDateStr,
      repeatType,
      interval,
      originalStartDayOfMonth
    );
    const nextDateObj = new Date(nextDateStr);

    if (repeatEndDate && nextDateObj > repeatEndDate) {
      break;
    }

    if (nextDateStr === currentDateStr) {
      console.warn('calculateNextRepeatDate did not advance the date. Breaking loop.', {
        currentDateStr,
        repeatType,
        interval,
      });
      break;
    }

    currentDateStr = nextDateStr;

    generatedEvents.push({
      ...baseEvent,
      id: generateSimpleId(),
      date: currentDateStr,
      repeat: {
        ...repeatInfo,
        id: repeatGroupId,
      },
    });

    if (generatedEvents.length >= 366 * 3) {
      console.warn('Reached maximum number of repeating events.');
      break;
    }
  }
  return generatedEvents;
}
