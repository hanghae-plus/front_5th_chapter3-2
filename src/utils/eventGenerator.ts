import { Event } from '../types';

// 반복 일정 계산
export const getNextOccurrence = (event: Event, startDate: Date): Date => {
  const eventDate = new Date(event.date);
  const nextDate = new Date(startDate);

  if (eventDate > startDate) {
    return eventDate;
  }

  switch (event.repeat.type) {
    case 'daily':
      nextDate.setDate(startDate.getDate() + event.repeat.interval);
      break;
    case 'weekly':
      nextDate.setDate(startDate.getDate() + 7 * event.repeat.interval);
      break;
    case 'monthly': {
      // 원본 이벤트의 일
      const originalDay = eventDate.getDate();
      // 다음달로 이동
      nextDate.setMonth(nextDate.getMonth() + event.repeat.interval);
      // 해당 월의 마지막 일 계산
      const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();

      // 원본 날짜가 29, 30, 31일이고 해당 월에 그 날짜가 없으면 월의 마지막 날로 설정
      if (originalDay > lastDayOfMonth) {
        nextDate.setDate(lastDayOfMonth);
      } else {
        nextDate.setDate(originalDay);
      }
      break;
    }
    case 'yearly': {
      // 2월 29일(윤년) 특수 케이스 처리
      if (eventDate.getMonth() === 1 && eventDate.getDate() === 29) {
        // 다음 해의 2월 28일로 설정
        nextDate.setFullYear(nextDate.getFullYear() + event.repeat.interval);
        // 다음해가 윤년인지 확인
        const isLeapYear = (year: number) => {
          return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        };

        // 윤년이 아니면 2월 28일로 설정
        if (!isLeapYear(nextDate.getFullYear())) {
          nextDate.setMonth(1);
          nextDate.setDate(28);
        } else {
          nextDate.setMonth(1);
          nextDate.setDate(29);
        }
      } else {
        // 일반적인 경우
        nextDate.setFullYear(nextDate.getFullYear() + event.repeat.interval);
      }
      break;
    }
    default:
      return eventDate;
  }

  return nextDate;
};

export const generateRepeatEvents = (event: Event): Event[] => {
  const events: Event[] = [];
  const baseEvent = { ...event };
  const startDate = new Date(event.date);
  let currentDate = new Date(startDate);

  // 종료 날짜 또는 종료 횟수 계산
  let endDate: Date | null = null;
  let maxOccurrences = 100;

  if (event.repeat.endDate) {
    endDate = new Date(event.repeat.endDate);
  } else {
    // 종료 날짜가 없는 경우 기본적으로 현재 날짜부터 1년 후 까지 생성
    const today = new Date();
    endDate = new Date(today);
    endDate.setFullYear(today.getFullYear() + 1);
  }

  events.push(baseEvent);

  for (let i = 0; i < maxOccurrences; i++) {
    currentDate = getNextOccurrence(baseEvent, currentDate);

    if (endDate && currentDate > endDate) {
      break;
    }

    const newEvent: Event = {
      ...baseEvent,
      id: `${baseEvent.id}-${i}`,
      date: currentDate.toISOString().split('T')[0],
    };

    events.push(newEvent);
  }

  return events;
};
