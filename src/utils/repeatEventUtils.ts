import { addDays, addWeeks, addMonths, addYears, parseISO, format, getDate } from 'date-fns';

import { EventForm, RepeatEndCondition, RepeatType } from '../types';

/**
 * 반복 타입과 간격, 그리고 원본 시작 일자를 기준으로 다음 날짜를 계산하는 함수
 * @param currentDate 현재 날짜
 * @param type 반복 타입
 * @param interval 간격
 * @param originalDayOfMonth 반복 이벤트가 시작된 원래의 '일' (예: 30일)
 * @returns 다음 날짜
 */
const calculateNextDate = (
  currentDate: Date,
  type: RepeatType,
  interval: number,
  originalDayOfMonth: number
): Date => {
  switch (type) {
    case 'daily':
      return addDays(currentDate, interval);
    case 'weekly':
      return addWeeks(currentDate, interval);
    case 'monthly': {
      const nextMonthDate = addMonths(currentDate, interval);
      const nextYear = nextMonthDate.getFullYear();
      const nextMonth = nextMonthDate.getMonth();

      const lastDayOfTargetMonth = new Date(nextYear, nextMonth + 1, 0).getDate();

      const targetDay = Math.min(originalDayOfMonth, lastDayOfTargetMonth);

      return new Date(nextYear, nextMonth, targetDay);
    }
    case 'yearly':
      return addYears(currentDate, interval);
    case 'none':
      return addDays(currentDate, interval);
    default:
      return addDays(currentDate, interval);
  }
};

/**
 * Date 객체를 YYYY-MM-DD 형태의 문자열로 변환 (타임존 문제 해결)
 * @param date 날짜 객체
 * @returns YYYY-MM-DD 문자열
 */
const formatDateToYYYYMMDD = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * 반복 종료 조건을 체크하는 함수
 * @param nextDate 다음 날짜
 * @param endCondition 종료 조건
 * @param endDate 종료 날짜
 * @param endCount 종료 횟수
 * @param currentCount
 * @returns 종료 여부
 */
const isRepeatEnd = (
  nextDate: Date,
  endCondition?: RepeatEndCondition,
  endDate?: string,
  endCount?: number,
  currentCount: number = 0
): boolean => {
  if (endCondition === 'date' && endDate) {
    const endDateObj = parseISO(endDate);
    const nextDateStr = formatDateToYYYYMMDD(nextDate);
    const endDateStr = formatDateToYYYYMMDD(endDateObj);

    return nextDateStr > endDateStr;
  }

  if (endCondition === 'count' && endCount && currentCount >= endCount) {
    return true;
  }

  if (endCondition === 'no-end') {
    const maxDateStr = '2025-06-30';
    const nextDateStr = formatDateToYYYYMMDD(nextDate);
    return nextDateStr > maxDateStr;
  }

  return false;
};

/**
 * 반복 이벤트를 생성하는 함수
 * @param event 이벤트
 * @returns 반복 이벤트 배열
 */
export const generateRepeatEvents = (event: EventForm): EventForm[] => {
  const {
    repeat: { type, interval, endCondition, endDate, endCount },
  } = event;

  if (!interval || interval <= 0 || type === 'none') {
    return [event];
  }

  const originalDateStr = event.date;
  const originalDateFromEvent = parseISO(originalDateStr);
  const normalizedOriginalDateStr = formatDateToYYYYMMDD(originalDateFromEvent);
  const normalizedOriginalDate = parseISO(normalizedOriginalDateStr);

  const originalDayOfMonth = getDate(normalizedOriginalDate);

  const events: EventForm[] = [
    {
      ...event,
      date: normalizedOriginalDateStr,
    },
  ];

  let currentProcessingDate = normalizedOriginalDate;
  let count = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const nextCalculatedDate = calculateNextDate(
      currentProcessingDate,
      type,
      interval,
      originalDayOfMonth
    );

    if (isRepeatEnd(nextCalculatedDate, endCondition, endDate, endCount, count)) {
      break;
    }

    const formattedDate = formatDateToYYYYMMDD(nextCalculatedDate);

    const newEvent: EventForm = {
      ...event,
      date: formattedDate,
    };

    events.push(newEvent);
    count++;
    currentProcessingDate = nextCalculatedDate;
  }

  console.log('events: ', events);
  return events;
};
