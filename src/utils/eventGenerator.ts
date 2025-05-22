import { Event } from '../types';

// 반복 일정 계산
export const getNextOccurrence = (event: Event, startDate: Date): Date => {
  const eventDate = new Date(event.date);
  const nextDate = new Date(startDate);

  if (eventDate > startDate) {
    return eventDate;
  }

  switch (event.repeat.type) {
    case 'daily': {
      // eventDate를 기준으로 시작
      let candidateDate = new Date(eventDate);
      // startDate 이후가 될 때까지 일수를 추가
      while (candidateDate <= startDate) {
        candidateDate.setDate(candidateDate.getDate() + event.repeat.interval);
      }

      nextDate.setTime(candidateDate.getTime());
      break;
    }
    case 'weekly': {
      // eventDate를 기준으로 시작
      let candidateDate = new Date(eventDate);
      // startDate 이후가 될 때까지 주수를 추가
      while (candidateDate <= startDate) {
        candidateDate.setDate(candidateDate.getDate() + 7 * event.repeat.interval);
      }

      nextDate.setTime(candidateDate.getTime());
      break;
    }
    case 'monthly': {
      // eventDate를 기준으로 시작
      const originalYear = eventDate.getFullYear();
      const originalMonth = eventDate.getMonth();
      const originalDay = eventDate.getDate();

      let targetYear = originalYear;
      let targetMonth = originalMonth;

      // startDate 이후가 될 때까지 월을 추가
      // eslint-disable-next-line no-constant-condition
      while (true) {
        targetMonth += event.repeat.interval;

        // 년도 조정
        while (targetMonth >= 12) {
          targetMonth -= 12;
          targetYear += 1;
        }

        // 해당 월의 마지막 일 계산
        const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

        // 원본 날짜가 29, 30, 31일이고 해당 월에 그 날짜가 없으면 월의 마지막 날로 설정
        const targetDay = originalDay > lastDayOfMonth ? lastDayOfMonth : originalDay;

        const candidateDate = new Date(targetYear, targetMonth, targetDay);

        if (candidateDate > startDate) {
          nextDate.setTime(candidateDate.getTime());
          break;
        }
      }
      break;
    }
    case 'yearly': {
      // eventDate를 기준으로 시작
      let candidateDate = new Date(eventDate);

      const isLeapYear = (year: number) => {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      };

      // startDate 이후가 될 때까지 년도를 추가
      while (candidateDate <= startDate) {
        candidateDate.setFullYear(candidateDate.getFullYear() + event.repeat.interval);

        // 2월 29일(윤년) 특수 케이스 처리
        if (eventDate.getMonth() === 1 && eventDate.getDate() === 29) {
          if (!isLeapYear(candidateDate.getFullYear())) {
            candidateDate.setMonth(1);
            candidateDate.setDate(28);
          } else {
            candidateDate.setMonth(1);
            candidateDate.setDate(29);
          }
        }
      }

      // 계산된 결과를 nextDate에 설정
      nextDate.setTime(candidateDate.getTime());
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
    // 종료 날짜가 없는 경우 이벤트 날짜 기준으로 1년 후까지 생성
    const eventStartDate = new Date(event.date);
    endDate = new Date(eventStartDate);
    endDate.setFullYear(eventStartDate.getFullYear() + 1);
  }

  events.push(baseEvent);

  for (let i = 0; i < maxOccurrences; i++) {
    currentDate = getNextOccurrence(baseEvent, currentDate);

    if (endDate && currentDate >= endDate) {
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
