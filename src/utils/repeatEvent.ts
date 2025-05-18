import { RepeatType, BaseRepeatInfo } from '../types';

// TODO: app config 쪽으로 이동할 수 있도록 변경
const END_DATE_LIMIT = new Date('2025-09-30');

export interface GetRepeatingDatesOptions extends BaseRepeatInfo {
  type: Exclude<RepeatType, 'none'>;
}

export function getRepeatingDates(date: string, repeat: GetRepeatingDatesOptions) {
  const dates = [];

  const startDate = new Date(date);
  let endDate = new Date(END_DATE_LIMIT);

  if (repeat.endDate) {
    const givenEndDate = new Date(repeat.endDate);
    if (givenEndDate < endDate) {
      endDate = givenEndDate;
    }
  }

  for (const date of repeatingDateGenerator(startDate, endDate, repeat)) {
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}

function* repeatingDateGenerator(
  startDate: Date,
  endDate: Date,
  options: Omit<GetRepeatingDatesOptions, 'endDate'>
) {
  let i = 0;
  let nextDate = startDate;
  const maxCount = options.count ?? Infinity;
  console.log('maxCount', maxCount);
  let currentCount = 0;

  while (nextDate <= endDate && currentCount < maxCount) {
    nextDate = getPossibleRepeatingDate(startDate, {
      type: options.type,
      interval: options.interval * i,
    });

    if (nextDate > endDate) {
      break;
    }

    if (
      (options.type === 'monthly' || options.type === 'yearly') &&
      nextDate.getDate() !== startDate.getDate()
    ) {
      i += 1;
      continue;
    }

    yield nextDate;
    i += 1;
    currentCount += 1;
  }
}

function getPossibleRepeatingDate(date: Date, options: Omit<GetRepeatingDatesOptions, 'endDate'>) {
  if (options.type === 'daily') {
    const fullYear = date.getFullYear();
    const fullMonth = date.getMonth();
    const fullDay = date.getDate();

    const nextDate = new Date(fullYear, fullMonth, fullDay + options.interval);
    return nextDate;
  } else if (options.type === 'weekly') {
    const fullYear = date.getFullYear();
    const fullMonth = date.getMonth();
    const fullDay = date.getDate();

    const nextDate = new Date(fullYear, fullMonth, fullDay + options.interval * 7);
    return nextDate;
  } else if (options.type === 'monthly') {
    const fullYear = date.getFullYear();
    const fullMonth = date.getMonth() + options.interval;
    const fullDay = date.getDate();

    const nextDate = new Date(fullYear, fullMonth, fullDay);

    return nextDate;
  } else if (options.type === 'yearly') {
    const fullYear = date.getFullYear() + options.interval;
    const fullMonth = date.getMonth();
    const fullDay = date.getDate();

    const nextDate = new Date(fullYear, fullMonth, fullDay);

    return nextDate;
  }

  throw new Error('Invalid repeat type');
}
