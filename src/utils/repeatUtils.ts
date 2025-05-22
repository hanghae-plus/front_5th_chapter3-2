import { Event } from '../types';

const DEFAULT_END_DATE = new Date('2025-09-30');
export const generateDailyDates = (event: Event): string[] => {
  const dates: string[] = [];
  const startDate = new Date(event.date);
  const endDate = event.repeat.endDate ? new Date(event.repeat.endDate) : DEFAULT_END_DATE;
  const interval = event.repeat?.interval || 1;

  let currentDate = startDate;
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate = new Date(currentDate.setDate(currentDate.getDate() + interval));
  }

  return dates;
};

export const generateWeeklyDates = (event: Event): string[] => {
  const dates: string[] = [];
  const startDate = new Date(event.date);
  const endDate = event.repeat.endDate ? new Date(event.repeat.endDate) : DEFAULT_END_DATE;
  const interval = event.repeat?.interval * 7;

  let currentDate = startDate;
  while (currentDate <= endDate) {
    let index = 0;
    console.log(index++);
    dates.push(currentDate.toISOString().split('T')[0]);
    // 다음 날짜 계산 (interval * 7일 후)
    currentDate = new Date(currentDate.setDate(currentDate.getDate() + interval));
  }

  return dates;
};

//테스트 실패!
// src/utils/repeatUtils.ts

export const generateMonthlyDates = (event: Event): string[] => {
  const { date: start, repeat } = event;
  if (!repeat || repeat.type !== 'monthly' || !repeat.endDate) {
    return [start];
  }

  const interval = repeat.interval;
  const result: string[] = [];
  const format = (d: Date) => d.toISOString().split('T')[0];

  // 시작일
  let current = new Date(start);
  result.push(format(current));

  const targetDay = current.getDate();
  const endDate = event.repeat.endDate ? new Date(event.repeat.endDate) : DEFAULT_END_DATE;

  let next = current;

  while (next <= endDate) {
    // 다음 반복 달 계산
    const year = current.getFullYear();
    const month = current.getMonth() + interval; // JS month 0~11 범위 허용(오버플로우 가능)
    // “month”가 12 이상이어도 new Date(year, month, ...)가 자동으로 연도/월을 조정해 줌

    // 그 달의 마지막 일수 구하기
    const lastDay = new Date(year, month + 1, 0).getDate();
    // 목표 일과 마지막 일 중 작은 것을 실제 날짜로 사용
    const day = Math.min(targetDay, lastDay);

    const next = new Date(year, month, day);
    if (next > endDate) break;

    result.push(format(next));
    current = next;
  }

  return result;
};

export const generateYearlyDates = (event: Event): string[] => {
  const dates: string[] = [];
  const startDate = new Date(event.date);
  const endDate = event.repeat.endDate ? new Date(event.repeat.endDate) : DEFAULT_END_DATE;
  const interval = event.repeat.interval;

  let currentDate = new Date(startDate);
  let yearsToAdd = 0; // 추가할 연도 수를 별도로 관리

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);

    // 다음 반복 시 추가할 연도 수 증가
    yearsToAdd += interval;

    // 시작 날짜의 월과 일을 가져옴
    const targetMonth = startDate.getMonth();
    const targetDay = startDate.getDate();

    // 다음 연도 계산
    const nextYear = startDate.getFullYear() + yearsToAdd;

    // 해당 연도 2월의 마지막 날짜 계산
    const lastDayOfMonth = new Date(nextYear, targetMonth + 1, 0).getDate();

    // 원하는 일자와 해당 월의 마지막 날짜 중 작은 값 선택
    const actualDay = Math.min(targetDay, lastDayOfMonth);

    // 새로운 날짜 설정
    currentDate = new Date(nextYear, targetMonth, actualDay);
  }

  return dates;
};

export const generateIntervalDaily = (event: Event): string[] => {
  const dates: string[] = [];
  const startDate = new Date(event.date);
  const endDate = event.repeat.endDate ? new Date(event.repeat.endDate) : DEFAULT_END_DATE;
  const interval = event.repeat.interval;

  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    // interval일 만큼 날짜 증가
    currentDate.setDate(currentDate.getDate() + interval);
  }

  return dates;
};

export const generateIntervalWeekly = (event: Event): string[] => {
  const dates: string[] = [];
  const startDate = new Date(event.date);
  const endDate = event.repeat.endDate ? new Date(event.repeat.endDate) : DEFAULT_END_DATE;
  const interval = event.repeat.interval;

  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    // interval주 만큼 날짜 증가 (7일 * interval)
    currentDate.setDate(currentDate.getDate() + 7 * interval);
  }

  return dates;
};

export const generateIntervalMonthly = (event: Event): string[] => {
  const dates: string[] = [];
  const startDate = new Date(event.date);
  const endDate = event.repeat.endDate ? new Date(event.repeat.endDate) : DEFAULT_END_DATE;
  const interval = event.repeat.interval;

  let currentDate = new Date(startDate);
  let monthsToAdd = 0;

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);

    // interval개월 만큼 증가
    monthsToAdd += interval;

    const nextDate = new Date(startDate);
    nextDate.setMonth(startDate.getMonth() + monthsToAdd);

    const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();

    const targetDay = startDate.getDate();
    const actualDay = Math.min(targetDay, lastDayOfMonth);

    currentDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), actualDay);
  }

  return dates;
};
