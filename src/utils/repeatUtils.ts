import { Event, EventForm, RepeatInfo } from '../types';

/**
 * 반복 일정 생성을 위한 유틸리티 함수들
 */

export interface RepeatEventOptions {
  maxEvents?: number; // 최대 생성 개수 (기본: 100)
  maxEndDate?: string; // 최대 종료일 (기본: 2025-09-30)
}

/**
 * 반복 일정들을 생성하는 메인 함수
 */
export const generateRepeatEvents = (
  baseEvent: Event | EventForm,
  options: RepeatEventOptions = {}
): (Event | EventForm)[] => {
  if (baseEvent.repeat.type === 'none') {
    return [baseEvent];
  }

  const { maxEvents = 100, maxEndDate = '2025-09-30' } = options;
  const events: (Event | EventForm)[] = [];

  const startDate = new Date(baseEvent.date);
  const endDate = baseEvent.repeat.endDate
    ? new Date(baseEvent.repeat.endDate)
    : new Date(maxEndDate);

  let currentDate = new Date(startDate);
  let eventCount = 0;
  const originalDay = startDate.getDate(); // 원본 날짜 저장 (윤년/월말 처리하기 위함)

  while (eventCount < maxEvents && currentDate <= endDate) {
    // 현재 날짜로 이벤트 생성
    const event = createSingleEvent(baseEvent, currentDate, eventCount);
    events.push(event);
    eventCount++;

    // 다음 반복 날짜 계산
    currentDate = calculateNextDate(currentDate, baseEvent.repeat, originalDay);
  }

  return events;
};

/**
 * 단일 이벤트 생성
 */
const createSingleEvent = (
  baseEvent: Event | EventForm,
  date: Date,
  index: number
): Event | EventForm => {
  const dateString = date.toISOString().split('T')[0];

  const event = {
    ...baseEvent,
    date: dateString,
  };

  // Event 타입인 경우 새로운 ID 생성
  if ('id' in baseEvent && baseEvent.id) {
    (event as Event).id = `${baseEvent.id}_repeat_${index + 1}`;
  } else {
    // 새로운 반복 일정 생성 시
    const timestamp = Date.now();
    (event as any).id = `repeat_${timestamp}_${index + 1}`;
  }

  return event;
};

/**
 * 다음 반복 날짜 계산 (윤년/월말 처리 포함)
 */
const calculateNextDate = (currentDate: Date, repeat: RepeatInfo, originalDay: number): Date => {
  const nextDate = new Date(currentDate);
  const interval = repeat.interval || 1;

  switch (repeat.type) {
    case 'daily': {
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    }

    case 'weekly': {
      nextDate.setDate(nextDate.getDate() + 7 * interval);
      break;
    }

    case 'monthly': {
      const targetYear = nextDate.getFullYear();
      const targetMonth = nextDate.getMonth() + interval;

      const newYear = targetYear + Math.floor(targetMonth / 12);
      const newMonth = targetMonth % 12;

      const safeDate = new Date(newYear, newMonth, 1);
      const lastDayOfTargetMonth = getLastDayOfMonth(newYear, newMonth);
      const targetDay = Math.min(originalDay, lastDayOfTargetMonth);

      safeDate.setDate(targetDay);
      return safeDate;
    }

    case 'yearly': {
      const nextYear = nextDate.getFullYear() + interval;
      const currentMonth = nextDate.getMonth();
      const safeYearDate = new Date(nextYear, currentMonth, 1);

      if (originalDay === 29 && currentMonth === 1) {
        const isLeapYear = isLeapYearCheck(nextYear);
        safeYearDate.setDate(isLeapYear ? 29 : 28);
      } else {
        const lastDayOfMonth = getLastDayOfMonth(nextYear, currentMonth);
        const targetDay = Math.min(originalDay, lastDayOfMonth);
        safeYearDate.setDate(targetDay);
      }

      return safeYearDate;
    }
  }

  return nextDate;
};

/**
 * 해당 년/월의 마지막 날 반환
 */
const getLastDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * 윤년 체크
 */
const isLeapYearCheck = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

/**
 * 반복 일정인지 확인
 */
export const isRepeatEvent = (event: Event | EventForm): boolean => {
  return event.repeat && event.repeat.type !== 'none';
};

/**
 * 반복 일정 제목에 (반복) 추가
 */
export const addRepeatTitle = (event: Event | EventForm): Event | EventForm => {
  return {
    ...event,
    title: event.title.startsWith('(반복)') ? event.title : `(반복) ${event.title}`,
  };
};

/**
 * 반복 일정을 단일 일정으로 변환
 */
export const convertToSingleEvent = (event: Event | EventForm): Event | EventForm => {
  return {
    ...event,
    repeat: { type: 'none', interval: 1 },
    title: event.title.startsWith('(반복) ')
      ? event.title.substring(4) // "(반복) " 제거
      : event.title,
  };
};

/**
 * 원본 반복 일정에서 생성된 일정인지 확인
 */
export const isGeneratedRepeatEvent = (event: Event): boolean => {
  // ID에 "_repeat_" 패턴이 있으면 생성된 반복 일정
  return 'id' in event && (event.id.includes('_repeat_') || event.id.startsWith('repeat_'));
};
