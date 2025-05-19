import { Event, EventForm } from '@/types';

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function generateRepeatEvents(baseEvent: EventForm): Event[] {
  const events: Event[] = [];
  const repeat = baseEvent.repeat;
  const start = new Date(baseEvent.date);

  if (!repeat || repeat.type === 'none') return [baseEvent as Event];

  const interval = repeat.interval ?? 1;
  const endDate = repeat.endDate ? new Date(repeat.endDate) : new Date(start);
  endDate.setMonth(endDate.getMonth() + 3); // fallback: 3회 반복

  const startDay = start.getDate();
  const startMonth = start.getMonth();
  const startYear = start.getFullYear();

  if (repeat.type === 'yearly') {
    for (let i = 0; i < 4; i++) {
      const year = startYear + i;
      let dateStr;

      if (startMonth === 1 && startDay === 29) {
        // 2월 29일 보정
        const correctedDay = isLeapYear(year) ? 29 : 28;
        dateStr = `${year}-02-${pad(correctedDay)}`;
      } else {
        const nextDate = new Date(year, startMonth, startDay);
        dateStr = nextDate.toISOString().split('T')[0];
      }

      events.push({
        ...baseEvent,
        id: undefined,
        date: dateStr,
      });
    }
    return events;
  }

  if (repeat.type === 'monthly') {
    const interval = repeat.interval ?? 1;
    const startDay = start.getDate();
    const startMonth = start.getMonth();
    const startYear = start.getFullYear();

    // ✅ fallback 적용 시에만 +3개월
    const end = repeat.endDate
      ? new Date(repeat.endDate)
      : (() => {
          const fallback = new Date(start);
          fallback.setMonth(fallback.getMonth() + 3);
          return fallback;
        })();

    let i = 0;

    while (true) {
      const targetMonth = startMonth + i * interval;
      const targetDate = new Date(startYear, targetMonth, 1);

      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      const day = Math.min(startDay, lastDay);

      const finalDate = new Date(Date.UTC(year, month, day));
      const dateStr = finalDate.toISOString().split('T')[0];

      if (new Date(dateStr) > end) break;

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
