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
  const { type: repeatType, interval, endDate: repeatEndDateStr, maxOccurrences } = repeatInfo;
  const generatedEvents: Event[] = [];

  if (repeatType === 'none') {
    return generatedEvents;
  }

  // 종료일이 없으면 생성 불가
  if (!repeatEndDateStr) {
    console.warn('No end date provided for repeating events.');
    return generatedEvents;
  }

  const repeatEndDate = new Date(repeatEndDateStr + 'T23:59:59');
  let currentDateStr = baseEvent.date;

  const originalStartDayOfMonth = Number(baseEvent.date.split('-')[2]);

  // 첫 번째 이벤트 추가
  generatedEvents.push({
    ...baseEvent,
    id: generateSimpleId(),
    repeat: {
      ...repeatInfo,
      id: repeatGroupId,
    },
    date: currentDateStr,
  });

  // maxOccurrences가 정의되어 있고 1 이하라면 첫 번째 이벤트만 반환
  if (maxOccurrences !== undefined && maxOccurrences <= 1) {
    return generatedEvents;
  }

  // 무한 루프 방지 및 종료 조건 적용
  let iterations = 0;
  const MAX_ITERATIONS = 366 * 3; // 약 3년치

  do {
    iterations++;

    // 최대 반복 횟수 체크
    if (maxOccurrences !== undefined && generatedEvents.length >= maxOccurrences) {
      break;
    }

    const nextDateStr = calculateNextRepeatDate(
      currentDateStr,
      repeatType,
      interval,
      originalStartDayOfMonth
    );
    const nextDateObj = new Date(nextDateStr);

    // 종료일 체크
    if (nextDateObj > repeatEndDate) {
      break;
    }

    // 날짜가 변경되지 않은 경우 체크 (무한 루프 방지)
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
  } while (iterations < MAX_ITERATIONS);

  return generatedEvents;
}
