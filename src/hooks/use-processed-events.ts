import { useMemo } from 'react';

import { Event } from '../types';
import { getDateRange, createDate, getLastDateStringOfMonth } from '../utils/dateUtils';
import { RecurRule } from '../utils/recur-rule';

/**
 * 처리된 이벤트 목록을 반환합니다.
 * @param events - 이벤트 목록
 * @param currentDate - 현재 날짜
 * @param view - 'week' 또는 'month'
 * @returns 처리된 이벤트 목록
 */
export function useProcessedEvents(
  events: Event[],
  currentDate: Date,
  view: 'week' | 'month'
): Event[] {
  return useMemo(() => {
    if (!events || events.length === 0) {
      return [];
    }

    // 1. 일반 이벤트와 반복 이벤트 분리
    const normalEvents = events.filter((event) => event.repeat.type === 'none');
    const recurringEvents = events.filter((event) => event.repeat.type !== 'none');

    // 2. 현재 view와 date에 맞게 날짜 범위 계산
    const { startDate, endDate } = getDateRange(currentDate, view);

    // 3. 반복 이벤트에서 해당 기간에 발생하는 모든 가상 인스턴스 생성
    const recurringInstances = recurringEvents.flatMap((event) => {
      // 날짜 문자열을 Date 객체로 변환 (타임존 문제 해결)
      const eventStartDate = createDate(event.date);

      let occurrenceDates: Date[] = [];

      try {
        // RecurRule 인스턴스 생성 시 count 또는 until 사용
        if (event.repeat.count && event.repeat.count > 0) {
          // 횟수 기반 반복
          const rule = new RecurRule({
            frequency: event.repeat.type as 'daily' | 'weekly' | 'monthly' | 'yearly',
            interval: event.repeat.interval,
            start: eventStartDate,
            count: event.repeat.count,
          });

          // 모든 반복 날짜를 계산한 후 현재 범위에 해당하는 것만 필터링
          const allOccurrences = rule.all();

          occurrenceDates = allOccurrences.filter((date) => {
            const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const normalizedStart = new Date(
              startDate.getFullYear(),
              startDate.getMonth(),
              startDate.getDate()
            );
            const normalizedEnd = new Date(
              endDate.getFullYear(),
              endDate.getMonth(),
              endDate.getDate()
            );

            return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
          });
        } else if (event.repeat.endDate) {
          // 날짜 기반 반복
          const eventEndDate = createDate(event.repeat.endDate, true);

          const rule = new RecurRule({
            frequency: event.repeat.type as 'daily' | 'weekly' | 'monthly' | 'yearly',
            interval: event.repeat.interval,
            start: eventStartDate,
            until: eventEndDate,
          });

          // 해당 기간 내 모든 발생 날짜 계산
          occurrenceDates = rule.between(startDate, endDate);
        } else {
          // count도 endDate도 없는 경우 기본값으로 현재 월 말일까지
          const fallbackEndDate = getLastDateStringOfMonth(currentDate);
          const eventEndDate = createDate(fallbackEndDate, true);

          const rule = new RecurRule({
            frequency: event.repeat.type as 'daily' | 'weekly' | 'monthly' | 'yearly',
            interval: event.repeat.interval,
            start: eventStartDate,
            until: eventEndDate,
          });

          occurrenceDates = rule.between(startDate, endDate);
        }
      } catch (error) {
        console.error('RecurRule 생성 또는 계산 중 오류:', error);
        return [];
      }

      // 각 발생 날짜마다 가상 이벤트 인스턴스 생성
      return occurrenceDates
        .map((date) => {
          // 날짜를 YYYY-MM-DD 형식으로 변환 (로컬 시간 기준)
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
          const day = String(date.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${day}`;
          const isOriginal = event.date === dateString;

          // 예외 날짜인 경우 건너뛰기
          if (event.repeat.exceptions?.includes(dateString)) {
            return null;
          }

          return {
            ...event,
            date: dateString,
            ...(!isOriginal && { id: `${event.id}-${dateString}` }),
          };
        })
        .filter((v) => v !== null); // null 제거
    });

    // 4. 일반 이벤트 중 날짜 범위에 포함되는 것만 필터링
    const filteredNormalEvents = normalEvents.filter((event) => {
      const eventDate = createDate(event.date);
      return eventDate >= startDate && eventDate <= endDate;
    });

    // 5. 모든 이벤트 합치기 및 날짜순으로 정렬
    return [...filteredNormalEvents, ...recurringInstances].sort((a, b) => {
      // YYYY-MM-DD 형식의 날짜 문자열을 비교
      return a.date.localeCompare(b.date);
    });
  }, [events, currentDate, view]);
}
