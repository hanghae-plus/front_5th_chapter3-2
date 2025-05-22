import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isBefore,
  isEqual,
  lastDayOfMonth,
} from 'date-fns';

import { EventForm } from '../types';

/**
 * 반복 설정에 따라 반복 일정을 생성하는 유틸 함수
 * - 반복 유형: daily, weekly, monthly, yearly
 * - 반복 간격: interval (1 이상)
 * - 반복 종료 조건: endDate 또는 count
 * - 특수 처리: 윤년 보정, 말일 보정
 */
export const generateRepeatedEvents = (base: EventForm): EventForm[] => {
  const { repeat } = base;

  // 반복이 없으면 단일 일정만 반환
  if (repeat.type === 'none') return [base];

  const events: EventForm[] = [];

  let currentDate = new Date(base.date);
  const originalDay = currentDate.getDate();

  const endDate = repeat.endDate ? new Date(repeat.endDate) : new Date('2025-09-30');
  let count = 0;

  /**
   * 반복 종료 조건:
   * - 종료 날짜 전 또는 같을 때까지
   * - count가 설정되었으면 count 이하까지만
   */
  while (
    (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) &&
    (!repeat.count || count < repeat.count)
  ) {
    // 현재 날짜를 기준으로 반복 이벤트 생성
    events.push({
      ...base,
      date: currentDate.toISOString().slice(0, 10),
    });
    count++;

    // 다음 반복 날짜 계산
    switch (repeat.type) {
      case 'daily':
        currentDate = addDays(currentDate, repeat.interval);
        break;

      case 'weekly':
        currentDate = addWeeks(currentDate, repeat.interval);
        break;

      case 'monthly': {
        const next = addMonths(currentDate, repeat.interval);
        // 말일 보정: ex) 1월 31일 -> 2월 28일 (존재하지 않는 날짜 방지)
        const endOfMonth = lastDayOfMonth(next).getDate();
        next.setDate(Math.min(originalDay, endOfMonth));
        currentDate = next;
        break;
      }

      case 'yearly': {
        const next = addYears(currentDate, repeat.interval);

        // 윤년 보정: 2월 29일, 평년 보정: 2월 28일
        if (
          currentDate.getMonth() === 1 && // 2월
          currentDate.getDate() === 29 &&
          next.getMonth() === 1 &&
          next.getDate() !== 29
        ) {
          next.setDate(28);
        }

        currentDate = next;
        break;
      }
    }
  }

  return events;
};
