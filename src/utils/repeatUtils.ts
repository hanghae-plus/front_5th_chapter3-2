import { RepeatInfo } from '../types';

const TEST_END_DATE = '2025-06-30';

export const getRepeatDates = (today: Date, repeatOptions: RepeatInfo) => {
  const startDate = new Date(today);
  const { type, interval, endDate: endDay } = repeatOptions;
  const endDate = endDay ? new Date(endDay) : new Date(TEST_END_DATE);

  const repeatDates: string[] = [];
  let currentDate = new Date(startDate);
  const startDay = startDate.getDate();

  while (currentDate <= endDate) {
    repeatDates.push(currentDate.toISOString().slice(0, 10));

    switch (type) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7 * interval);
        break;
      case 'monthly': {
        let nextMonth = currentDate.getMonth() + interval;
        let nextYear = currentDate.getFullYear();
        while (nextMonth > 11) {
          nextMonth -= 12;
          nextYear += 1;
        }

        const nextDate = new Date(currentDate);
        nextDate.setFullYear(nextYear);
        nextDate.setMonth(nextMonth);
        nextDate.setDate(startDay);

        if (nextDate.getMonth() !== nextMonth) {
          let found = false;
          let tempMonth = nextMonth;
          let tempYear = nextYear;
          while (!found) {
            tempMonth += interval;
            while (tempMonth > 11) {
              tempMonth -= 12;
              tempYear += 1;
            }
            const tempDate = new Date(nextDate);
            tempDate.setFullYear(tempYear);
            tempDate.setMonth(tempMonth);
            tempDate.setDate(startDay);
            if (tempDate.getMonth() === tempMonth) {
              currentDate = tempDate;
              found = true;
            }
            if (tempYear > endDate.getFullYear() + 10) break;
          }
        } else {
          currentDate = nextDate;
        }
        break;
      }
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + interval);
        break;
      default:
        return repeatDates;
    }
  }

  return repeatDates;
};
