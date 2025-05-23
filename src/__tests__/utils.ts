import { fillZero } from '../utils/dateUtils';

/**
 * 두 날짜가 같은지 확인하는 테스트 유틸 함수
 * @param date1 : 날짜 1
 * @param date2 : 날짜 2
 */
export const assertDate = (date1: Date, date2: Date) => {
  expect(date1.toISOString()).toBe(date2.toISOString());
};

export const parseHM = (timestamp: number) => {
  const date = new Date(timestamp);
  const h = fillZero(date.getHours());
  const m = fillZero(date.getMinutes());
  return `${h}:${m}`;
};
