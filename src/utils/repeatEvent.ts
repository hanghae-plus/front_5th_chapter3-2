import { EventForm, Event, RepeatType } from '../types';

const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

const getLastDayOfMonth = (year: number, month: number): number => {
  if (month === 1) {
    // 2월
    return isLeapYear(year) ? 29 : 28;
  }
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
};

const calculateNextDate = (currentDate: Date, repeatType: RepeatType, interval: number): Date => {
  const nextDate = new Date(currentDate);

  switch (repeatType) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7 * interval);
      break;
    case 'monthly': {
      const currentDay = nextDate.getDate();
      const currentMonth = nextDate.getMonth();
      // const currentYear = nextDate.getFullYear();

      // 다음 달로 이동
      nextDate.setMonth(currentMonth + interval);

      // 월말 날짜 처리
      const lastDay = getLastDayOfMonth(nextDate.getFullYear(), nextDate.getMonth());
      if (currentDay > lastDay) {
        nextDate.setDate(lastDay);
      } else {
        nextDate.setDate(currentDay);
      }
      break;
    }
    case 'yearly': {
      const currentMonth = nextDate.getMonth();
      const currentDay = nextDate.getDate();
      const currentYear = nextDate.getFullYear();

      // 다음 해로 이동
      nextDate.setFullYear(currentYear + interval);

      // 2월 29일 처리
      if (currentMonth === 1 && currentDay === 29) {
        // 윤년이 아니면 3월 1일로 설정
        if (!isLeapYear(nextDate.getFullYear())) {
          nextDate.setMonth(2);
          nextDate.setDate(1);
        }
      } else {
        // 2월 29일이 아닌 경우, 다음 해의 같은 날짜로 설정
        nextDate.setMonth(currentMonth);
        nextDate.setDate(currentDay);
      }
      break;
    }
  }

  return nextDate;
};

export const createRepeatEvents = (event: Event | EventForm) => {
  const { repeat, date } = event;
  const { type, interval, endDate } = repeat;

  if (type === 'none') {
    return [event];
  }

  const repeatEndDate = endDate ? new Date(endDate) : new Date('2025-09-30');
  let currentDate = new Date(date);

  const repeatEvents: (Event | EventForm)[] = [];

  // 첫 번째 이벤트 추가
  repeatEvents.push({
    ...event,
    date: currentDate.toISOString().split('T')[0],
    repeat: {
      type,
      interval,
      endDate,
    },
  });

  // 다음 날짜 계산
  currentDate = calculateNextDate(currentDate, type, interval);

  // yearly 타입이고 2월 29일인 경우, 윤년의 2월 29일만 추가
  if (type === 'yearly' && currentDate.getMonth() === 1 && currentDate.getDate() === 29) {
    while (currentDate <= repeatEndDate) {
      if (isLeapYear(currentDate.getFullYear())) {
        repeatEvents.push({
          ...event,
          date: currentDate.toISOString().split('T')[0],
          repeat: {
            type,
            interval,
            endDate,
          },
        });
      }
      currentDate = calculateNextDate(currentDate, type, interval);
    }
  } else {
    // 다른 타입의 경우 기존 로직 유지
    while (currentDate <= repeatEndDate) {
      repeatEvents.push({
        ...event,
        date: currentDate.toISOString().split('T')[0],
        repeat: {
          type,
          interval,
          endDate,
        },
      });
      currentDate = calculateNextDate(currentDate, type, interval);
    }
  }

  return repeatEvents;
};
