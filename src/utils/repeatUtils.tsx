import { RepeatClockIcon, RepeatIcon, CalendarIcon, SunIcon } from '@chakra-ui/icons';
import { ReactElement } from 'react';

import { Event, RepeatType } from '../types';
import { formatDate } from './dateUtils';

// 1. 반복 유형에 따른 라벨 반환
export function getRepeatTypeLabel(type: RepeatType): string {
  switch (type) {
    case 'daily':
      return '매일';
    case 'weekly':
      return '매주';
    case 'monthly':
      return '매월';
    case 'yearly':
      return '매년';
    default:
      return '반복 없음';
  }
}

// 2. 반복 일정 생성 함수
export function generateRepeatDates(
  startDate: string,
  repeat: { type: RepeatType; interval: number; endDate?: string }
): string[] {
  const results: string[] = [];
  let current = new Date(startDate);
  const end = repeat.endDate ? new Date(repeat.endDate) : null;

  while (!end || current <= end) {
    results.push(formatDate(current));

    switch (repeat.type) {
      case 'daily':
        current.setDate(current.getDate() + repeat.interval);
        break;

      case 'weekly':
        current.setDate(current.getDate() + 7 * repeat.interval);
        break;

      case 'monthly': {
        const initial = new Date(startDate);
        const baseDay = initial.getDate();
        const baseMonth = initial.getMonth();
        const baseYear = initial.getFullYear();

        const count = results.length + 1;
        const totalMonth = baseMonth + repeat.interval * (count - 1);
        const nextYear = baseYear + Math.floor(totalMonth / 12);
        const nextMonth = totalMonth % 12;

        const lastDay = new Date(nextYear, nextMonth + 1, 0).getDate();
        current = new Date(nextYear, nextMonth, Math.min(baseDay, lastDay));
        break;
      }

      case 'yearly': {
        const year = current.getFullYear() + repeat.interval;
        const month = current.getMonth();
        const day = current.getDate();

        const lastDay = new Date(year, month + 1, 0).getDate();
        current = new Date(year, month, Math.min(day, lastDay));
        break;
      }
    }
  }

  return results;
}

// 3. 반복 일정인지 여부에 따라 태그 반환
export function getRecurringIcon(type: RepeatType): ReactElement | null {
  switch (type) {
    case 'daily':
      return <RepeatClockIcon data-testid="icon-daily" color="gray.400" boxSize={3} />;
    case 'weekly':
      return <RepeatIcon data-testid="icon-weekly" color="blue.400" boxSize={3} />;
    case 'monthly':
      return <CalendarIcon data-testid="icon-monthly" color="purple.400" boxSize={3} />;
    case 'yearly':
      return <SunIcon data-testid="icon-yearly" color="orange.300" boxSize={3} />;
    default:
      return null;
  }
}

// 4. 종료일을 기준으로 반복 종료 여부 판단
export function isRepeatEnded(currentDate: string, endDate?: string): boolean {
  if (!endDate) return false;
  return new Date(currentDate) >= new Date(endDate);
}

// 5. 반복 이벤트를 단일 일정으로 전환
export function convertRecurringToSingleEvent(event: Event): Event {
  return {
    ...event,
    repeat: {
      type: 'none',
      interval: 0,
    },
  };
}

// 6. 반복 일정에서 특정 날짜만 제거
export function deleteSingleOccurrence(event: Event, dateToExclude: string): Event {
  const updatedExcluded = event.excludedDates ?? [];

  if (!updatedExcluded.includes(dateToExclude)) {
    updatedExcluded.push(dateToExclude);
  }

  return {
    ...event,
    excludedDates: updatedExcluded,
  };
}
