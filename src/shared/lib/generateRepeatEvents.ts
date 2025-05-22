import { Event, EventForm } from '@/types';

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * 주어진 이벤트를 기반으로 반복 이벤트를 생성합니다.
 * @param baseEvent
 * @returns
 */
export function generateRepeatEvents(baseEvent: EventForm): Event[] {
  const events: Event[] = []; // 반복 이벤트를 저장할 배열
  const repeat = baseEvent.repeat; // 반복 정보
  const start = new Date(baseEvent.date); // 시작 날짜

  if (!repeat || repeat.type === 'none') return [baseEvent as Event];

  const interval = repeat.interval ?? 1;
  const count = repeat.count ?? 10; // fallback: 4회 반복

  const endDate = repeat.endDate ? new Date(repeat.endDate) : new Date('2025-09-30'); // fallback: 2025년 9월 30일까지
  endDate.setHours(23, 59, 59, 999); // 종료일을 하루의 끝으로 설정하여 포함 처리

  const startDay = start.getDate();
  const startMonth = start.getMonth();

  if (repeat.type === 'daily') {
    let i = 0;

    while (i < count) {
      const newDate = new Date(start);
      newDate.setDate(start.getDate() + i * interval);

      if (newDate > endDate) break;

      const dateStr = newDate.toISOString().split('T')[0];

      if (repeat.excludeDates?.includes(dateStr)) {
        i++; // 제외할 날짜는 건너뜀
        continue;
      }

      events.push({
        ...baseEvent,
        id: undefined,
        date: newDate.toISOString().split('T')[0],
      });

      i++;
    }

    return events;
  }

  if (repeat.type === 'weekly') {
    const daysOfWeek = (repeat.daysOfWeek ?? [start.getDay()]).map((d) => Number(d));
    const excludeDates = repeat.excludeDates ?? [];

    let generated = 0;
    let current = new Date(start);

    while (current <= endDate && generated < count) {
      const day = current.getDay(); // 현재 요일 (0~6)
      const dateStr = current.toISOString().split('T')[0];

      const daysSinceStart = Math.floor(
        (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      const weeksSinceStart = Math.floor(daysSinceStart / 7);

      if (
        weeksSinceStart % interval === 0 &&
        daysOfWeek.includes(day) &&
        !excludeDates.includes(dateStr)
      ) {
        events.push({
          ...baseEvent,
          id: undefined,
          date: dateStr,
        });
        generated++;
      }

      current.setDate(current.getDate() + 1); // 하루씩 증가
    }

    return events;
  }

  if (repeat.type === 'yearly') {
    const interval = repeat.interval ?? 1;
    const startYear = start.getFullYear();

    let i = 0;

    while (i < count) {
      const targetYear = startYear + i * interval;
      const targetDate = new Date(targetYear, startMonth, startDay);

      if (repeat.endDate && targetDate > endDate) break;

      let dateStr;
      if (startMonth === 1 && startDay === 29) {
        const correctedDay = isLeapYear(targetYear) ? 29 : 28;
        dateStr = `${targetYear}-02-${pad(correctedDay)}`;
      } else {
        dateStr = targetDate.toISOString().split('T')[0];
      }

      if (repeat.excludeDates?.includes(dateStr)) {
        i++;
        continue; // ❗ 제외 날짜 건너뜀
      }

      events.push({
        ...baseEvent,
        id: undefined,
        date: dateStr,
      });

      i++;
    }

    return events;
  }

  if (repeat.type === 'monthly') {
    const interval = repeat.interval ?? 1;
    const startDay = start.getDate();
    const startMonth = start.getMonth();
    const startYear = start.getFullYear();
    const count = repeat.count ?? Infinity;

    const daysOfWeek = repeat.daysOfWeek?.map(Number); // 예: ['2'] → [2] (화요일)

    let i = 0;

    while (events.length < count) {
      const targetMonth = startMonth + i * interval;
      const targetDate = new Date(startYear, targetMonth, 1);

      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();

      let finalDate;

      if (daysOfWeek && daysOfWeek.length > 0) {
        // ✅ 매월 지정 요일 (예: 매월 첫 번째 화요일)
        const targetDayOfWeek = daysOfWeek[0];
        while (targetDate.getDay() !== targetDayOfWeek) {
          targetDate.setDate(targetDate.getDate() + 1);
        }
        finalDate = new Date(Date.UTC(year, month, targetDate.getDate()));
      } else {
        // ✅ 기존 일자 기반 반복
        const lastDay = new Date(year, month + 1, 0).getDate();
        const day = Math.min(startDay, lastDay);
        finalDate = new Date(Date.UTC(year, month, day));
      }

      const dateStr = finalDate.toISOString().split('T')[0];

      if (repeat.endDate && new Date(dateStr) > endDate) break;
      if (repeat.excludeDates?.includes(dateStr)) {
        i++;
        continue;
      }

      events.push({
        ...baseEvent,
        id: undefined,
        date: dateStr,
      });

      i++;
    }

    return events;
  }

  // 다른 반복 유형은 기본 이벤트 1개만
  return [baseEvent as Event];
}
