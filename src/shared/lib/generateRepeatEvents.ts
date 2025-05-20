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
  const count = repeat.count ?? 4; // fallback: 4회 반복

  const endDate = repeat.endDate ? new Date(repeat.endDate) : new Date(start);
  endDate.setMonth(endDate.getMonth() + 3); // fallback: 3회 반복

  const startDay = start.getDate();
  const startMonth = start.getMonth();

  if (repeat.type === 'daily') {
    for (let i = 0; i < count; i++) {
      const newDate = new Date(start);
      newDate.setDate(start.getDate() + i * interval);
      events.push({
        ...baseEvent,
        id: undefined,
        date: newDate.toISOString().split('T')[0],
      });
    }
    return events;
  }

  if (repeat.type === 'weekly') {
    for (let i = 0; i < count; i++) {
      const newDate = new Date(start);
      newDate.setDate(start.getDate() + i * interval * 7);
      events.push({
        ...baseEvent,
        id: undefined,
        date: newDate.toISOString().split('T')[0],
      });
    }
    return events;
  }

  if (repeat.type === 'yearly') {
    const interval = repeat.interval ?? 1;
    const startYear = start.getFullYear();

    console.log('interval', interval);

    let i = 0;

    while (i < count) {
      const targetYear = startYear + i * interval;
      const targetDate = new Date(targetYear, startMonth, startDay);

      if (repeat.endDate && targetDate > endDate) break;

      let dateStr;

      if (startMonth === 1 && startDay === 29) {
        // 2월 29일 보정
        const correctedDay = isLeapYear(targetYear) ? 29 : 28;
        dateStr = `${targetYear}-02-${pad(correctedDay)}`;
      } else {
        dateStr = targetDate.toISOString().split('T')[0];
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

    let i = 0;

    while (i < count) {
      const targetMonth = startMonth + i * interval;
      const targetDate = new Date(startYear, targetMonth, 1);

      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      const day = Math.min(startDay, lastDay);

      const finalDate = new Date(Date.UTC(year, month, day));
      const dateStr = finalDate.toISOString().split('T')[0];

      if (repeat.endDate && new Date(dateStr) > new Date(repeat.endDate)) break;

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
