import { EventForm } from '../types';
import { formatDate } from './dateUtils';

/**
 * 최대 반복 종료 날짜
 */
const MAX_REPEAT_END_DATE = '2025-09-30';

/**
 * 윤년인지 확인.
 * @param year: 연도
 * @return: 윤년 여부
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * 해당 연월의 마지막 날짜를 반환.
 * @param year: 연도
 * @param month: 월
 * @return: 해당 연월의 마지막 날짜
 */
export function getLastDayOfMonth(year: number, month: number): number {
  // JavaScript의 Date 객체에서 month는 0부터 시작하므로, 다음달의 0일(이전달의 마지막 날)을 구함.
  return new Date(year, month, 0).getDate();
}

/**
 * 주어진 날짜에 이벤트를 생성해야 하는지 확인.
 * @param eventData: 반복 일정 정보
 * @param targetDate: 확인할 날짜
 * @return: 이벤트 생성 여부
 */
export function shouldCreateEventForDate(eventData: EventForm, targetDate: Date): boolean {
  const { date, repeat } = eventData;

  if (repeat.type === 'none') {
    return false;
  }

  // 종료일 체크
  if (repeat.endDate && targetDate > new Date(repeat.endDate)) {
    return false;
  }

  const eventDate = new Date(date);
  const eventDay = eventDate.getDate();
  const eventMonth = eventDate.getMonth();
  const eventYear = eventDate.getFullYear();

  const targetDay = targetDate.getDate();
  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();

  // 시작일은 항상 포함
  if (eventDay === targetDay && eventMonth === targetMonth && eventYear === targetYear) {
    return true;
  }

  // 시작일과 같거나 이전 날짜는 포함하지 않음
  if (targetDate < eventDate) {
    return false;
  }

  switch (repeat.type) {
    case 'daily': {
      // 일간 반복: 일 간격으로 체크
      const diffTime = targetDate.getTime() - eventDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays % repeat.interval === 0;
    }

    case 'weekly': {
      // 주간 반복: 주 간격과 요일이 같은지 체크
      const diffTime = targetDate.getTime() - eventDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);

      // 같은 요일이고 주 간격이 맞는지 확인
      return targetDate.getDay() === eventDate.getDay() && diffWeeks % repeat.interval === 0;
    }

    case 'monthly': {
      // 월간 반복: 월 간격과 날짜가 같은지 체크
      const monthDiff = (targetYear - eventYear) * 12 + (targetMonth - eventMonth);

      if (monthDiff % repeat.interval !== 0) {
        return false;
      }

      // 매월 같은 날짜에 반복
      if (targetDay === eventDay) {
        return true;
      }

      // 31일처럼 해당 월에 없는 날짜인 경우, 월의 마지막 날에 생성
      const lastDayOfTargetMonth = getLastDayOfMonth(targetYear, targetMonth + 1);
      return eventDay > lastDayOfTargetMonth && targetDay === lastDayOfTargetMonth;
    }

    case 'yearly': {
      // 연간 반복: 년 간격과 월/일이 같은지 체크
      const yearDiff = targetYear - eventYear;

      if (yearDiff % repeat.interval !== 0) {
        return false;
      }

      // 2월 29일이고 윤년이 아닌 경우 생성하지 않음
      if (eventMonth === 1 && eventDay === 29 && !isLeapYear(targetYear)) {
        return false;
      }

      // 같은 월/일에 반복
      return targetMonth === eventMonth && targetDay === eventDay;
    }

    default:
      return false;
  }
}

/**
 * 최종 종료일을 반환.
 * MAX_REPEAT_END_DATE는 2025년 9월 30일이므로 2025년 이후의 날짜는 생성하지 않음.
 * 2월 29일이 윤년인 경우 2025년 이후의 날짜는 생성하지 않기 때문에 윤년으로 설정한 경우엔 MAX_REPEAT_END_DATE를 풀어줘야함.
 * 예를 들어 2025년 2월 29일을 설정하고 연간 반복 간격을 4년이면 2029년 2월 29일이 최종 종료일이 됨.
 * @param eventData: 반복 일정 정보
 * @return: 최종 종료일
 */
function getFinalEndDate(eventData: EventForm): Date {
  const startDate = new Date(eventData.date);
  const maxLimit = new Date(MAX_REPEAT_END_DATE);

  if (eventData.repeat.endDate) {
    return new Date(eventData.repeat.endDate);
  }

  const isFeb29 =
    eventData.repeat.type === 'yearly' &&
    startDate.getMonth() === 1 &&
    startDate.getDate() === 29 &&
    isLeapYear(startDate.getFullYear());

  if (isFeb29) {
    let year = startDate.getFullYear() + eventData.repeat.interval;
    while (year <= 2050) {
      if (isLeapYear(year)) {
        return new Date(`${year}-02-29`);
      }
      year += eventData.repeat.interval;
    }
  }

  return maxLimit;
}

/**
 * 이벤트 id를 생성.
 * @param event: 이벤트 정보
 * @param index: 이벤트 인덱스
 * @param seed: 씨앗
 * @return: 이벤트 id
 */
function generateEventId(event: EventForm, index: number, seed: string) {
  const safeTitle = event.title.replace(/\s/g, '');
  const safeTime = `${event.date}-${event.startTime}`.replace(/:/g, '');
  return `${safeTitle}-${safeTime}-${seed}-${index + 1}`;
}

/**
 * 반복 일정에 대한 모든 이벤트 객체를 생성.
 * @param eventData: 반복 일정 정보
 * @return: 반복 일정 정보 배열
 */
export function createRepeatingEvents(eventData: EventForm): EventForm[] {
  if (eventData.repeat.type === 'none') {
    return [];
  }

  const startDate = new Date(eventData.date);
  const finalEndDate = getFinalEndDate(eventData);

  // 종료일이 설정되지 않았다면 MAX_REPEAT_END_DATE로 설정
  // const userEndDate = eventData.repeat.endDate ? new Date(eventData.repeat.endDate) : null;
  // const maxEndDate = new Date(MAX_REPEAT_END_DATE);

  // 종료일은 최대 MAX_REPEAT_END_DATE로 설정
  // const finalEndDate = userEndDate && userEndDate < maxEndDate ? userEndDate : maxEndDate;

  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  const seed = Date.now().toString(); // 고유 반복 그룹 식별용 시드

  // 시작일부터 종료일까지 하루씩 증가하며 체크
  while (currentDate <= finalEndDate) {
    if (shouldCreateEventForDate(eventData, currentDate)) {
      // 중복된 날짜를 추가하지 않도록 체크
      if (
        !dates.some((existingDate) => existingDate.toDateString() === currentDate.toDateString())
      ) {
        dates.push(new Date(currentDate));
      }
    }
    // 다음 날로 이동
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // 각 날짜에 대해 복제된 이벤트 객체 생성
  return dates.map((date, index) => ({
    ...eventData,
    id: generateEventId({ ...eventData, date: formatDate(date) }, index, seed), // ← 고유 id 생성
    date: formatDate(date),
  }));
}
