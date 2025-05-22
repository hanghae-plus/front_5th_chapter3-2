import { Event } from '../types';

export function generateRecurringEvents(event: Event): Event[] {
  if (!event.isRecurring || event.repeat.interval <= 0) {
    return event.repeat.type === 'none' ? [event] : [];
  }

  const startDate = new Date(event.date);
  let endDate: Date;

  // 종료 조건에 따른 처리
  switch (event.repeat.endType) {
    case 'date':
      if (!event.repeat.endDate) return [];
      endDate = new Date(event.repeat.endDate);
      if (endDate < startDate) return [];
      break;

    case 'count':
      if (!event.repeat.endCount || event.repeat.endCount <= 0) return [];
      endDate = calculateEndDateByCount(startDate, event.repeat);
      break;

    case 'none':
    default:
      // 종료일이 없는 경우 2025-09-30로 제한
      endDate = new Date('2025-09-30');
      break;
  }

  const events: Event[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    events.push({
      ...event,
      id: undefined,
      date: formatDate(currentDate),
    });

    // 반복 타입에 따른 다음 날짜 계산
    const nextDate = new Date(currentDate);
    switch (event.repeat.type) {
      case 'daily':
        nextDate.setDate(currentDate.getDate() + event.repeat.interval);
        break;
      case 'weekly':
        nextDate.setDate(currentDate.getDate() + 7 * event.repeat.interval);
        break;
      case 'monthly':
        nextDate.setMonth(currentDate.getMonth() + event.repeat.interval);
        break;
      case 'yearly':
        nextDate.setFullYear(currentDate.getFullYear() + event.repeat.interval);
        // 윤년 처리 수정
        if (startDate.getMonth() === 1 && startDate.getDate() === 29) {
          // 2월 29일 시작인 경우
          if (!isLeapYear(nextDate.getFullYear())) {
            nextDate.setMonth(1); // 2월로 설정
            nextDate.setDate(28); // 28일로 설정
          }
        }
        break;
    }
    currentDate = nextDate;

    // count 타입일 경우 지정된 횟수만큼만 생성
    if (event.repeat.endType === 'count' && events.length >= event.repeat.endCount!) {
      break;
    }
  }

  return events;
}

function calculateEndDateByCount(startDate: Date, repeat: Event['repeat']): Date {
  const count = repeat.endCount! - 1; // 시작일을 포함하므로 1을 뺌
  const endDate = new Date(startDate);

  switch (repeat.type) {
    case 'daily':
      endDate.setDate(endDate.getDate() + count * repeat.interval);
      break;
    case 'weekly':
      endDate.setDate(endDate.getDate() + count * 7 * repeat.interval);
      break;
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + count * repeat.interval);
      break;
    case 'yearly':
      endDate.setFullYear(endDate.getFullYear() + count * repeat.interval);
      break;
  }
  return endDate;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
