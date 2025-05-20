import { formatDate } from './dateUtils';
import { EventForm } from '../types';

export const createRepeatEvents = (eventData: EventForm) => {
  const { type, interval, endDate } = eventData.repeat;
  const startDate = new Date(eventData.date);
  const maxEndDate = new Date('2025-09-30');
  const repeatEndDate = endDate ? new Date(endDate) : maxEndDate;
  const isLastDayOfMonth = isLastDay(startDate);

  if (type === 'none' || interval === 0) {
    return [eventData];
  }

  // 반복 날짜 생성
  const dates = generateRecurringDates({
    startDate,
    repeatEndDate,
    type,
    interval,
    isLastDayOfMonth,
  });

  // 각 날짜에 대해 이벤트 객체 생성
  return dates.map((date) => {
    return {
      ...eventData,
      date: formatDate(date), // YYYY-MM-DD 형식으로 변환
    };
  });
};

function isLastDay(date: Date) {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return date.getDate() === lastDay;
}

interface generateRecurringDatesParam {
  startDate: Date;
  repeatEndDate: Date;
  type: string;
  interval: number;
  isLastDayOfMonth: boolean;
}

function generateRecurringDates({
  startDate,
  repeatEndDate,
  type,
  interval,
  isLastDayOfMonth,
}: generateRecurringDatesParam) {
  // 결과 배열 초기화
  const dates = [];

  // 시작 날짜 복사
  let currentDate = new Date(startDate);

  // 종료 날짜까지 반복
  while (currentDate <= repeatEndDate) {
    // 결과 배열에 현재 날짜 추가
    dates.push(new Date(currentDate));

    // 반복 유형에 따라 다음 날짜 계산
    switch (type) {
      case 'daily': {
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      }
      case 'weekly': {
        currentDate.setDate(currentDate.getDate() + 7 * interval);
        break;
      }
      case 'monthly': {
        if (isLastDayOfMonth) {
          currentDate.setMonth(currentDate.getMonth() + interval);
          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        }

        // 월말 처리 (예: 1월 31일 -> 2월 28일)
        // 월이 예상과 다르면 해당 월의 마지막 날로 설정
        let actualMonth = currentDate.getMonth();
        let expectedMonth = (startDate.getMonth() + interval * dates.length) % 12;

        if (actualMonth !== expectedMonth) {
          // 해당 월의 마지막 날짜로 설정
          currentDate = new Date(currentDate.getFullYear(), actualMonth, 0);
        }
        break;
      }
      case 'yearly': {
        currentDate.setFullYear(currentDate.getFullYear() + interval);
        break;
      }
    }
  }

  return dates;
}
