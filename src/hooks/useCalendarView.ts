import { s } from 'framer-motion/client';
import { useEffect, useState } from 'react';

import { fetchHolidays } from '../apis/fetchHolidays';
import { isDate } from '../utils/dateUtils';

export const useCalendarView = () => {
  const [view, setView] = useState<'week' | 'month'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<{ [key: string]: string }>({});
  const [specificDate, setSpecificDate] = useState<string>('');

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      if (view === 'week') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      } else if (view === 'month') {
        newDate.setDate(1); // 항상 1일로 설정
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      }
      return newDate;
    });
  };

  const navigateToSpecificDate = (date: string) => {
    const newDate = new Date(date);
    if (!isDate(newDate)) {
      return;
    }
    setCurrentDate(newDate);
  };

  useEffect(() => {
    setHolidays(fetchHolidays(currentDate));
  }, [currentDate]);

  return {
    view,
    setView,
    currentDate,
    setCurrentDate,
    holidays,
    navigate,
    navigateToSpecificDate,
    specificDate,
    setSpecificDate,
  };
};
