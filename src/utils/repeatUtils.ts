// src/utils/repeatUtils.ts (새 파일)

import { Event, RepeatInfo } from '../types'; // Event, RepeatInfo 타입 임포트

/**
 * 주어진 기본 이벤트와 반복 정보를 바탕으로 반복되는 모든 이벤트 인스턴스를 생성합니다.
 * (아직 구현되지 않음)
 */
export function generateRepeatingEvents(
  baseEvent: Omit<Event, 'id'>, // 기본 이벤트 정보 (id는 여기서 생성하거나 서버에서 받음)
  repeatInfo: RepeatInfo,
  repeatGroupId: string // 이 반복 그룹에 대한 고유 ID
): Event[] {
  // TODO: 이 함수를 TDD로 구현합니다.
  throw new Error('아직 구현되지 않았습니다.');
}

/**
 * 특정 반복 규칙에 따라 다음 반복 날짜를 계산합니다.
 * (아직 구현되지 않음)
 */
export function calculateNextRepeatDate(
  currentDate: string, // YYYY-MM-DD 형식
  repeatType: RepeatInfo['type'],
  interval: number
): string {
  // TODO: 이 함수를 TDD로 구현합니다.
  throw new Error('아직 구현되지 않았습니다.');
}

/**
 * 윤년 및 월말 처리를 고려하여 날짜를 조정합니다.
 * 예: 2025-01-31 이고 매월 반복이면, 다음 달은 2025-02-28이 됩니다.
 * (아직 구현되지 않음)
 */
export function adjustDateForRepeat(
  year: number,
  month: number, // 0-11 (Date 객체 기준)
  day: number,
  originalDay: number // 반복 시작일의 '일' (예: 31일)
): string {
  // TODO: 이 함수를 TDD로 구현합니다.
  throw new Error('아직 구현되지 않았습니다.');
}
